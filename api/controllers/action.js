'use strict';
const fetch = require('node-fetch');
const querystring = require('querystring')
const spawn = require('child_process').spawn
const config = require('config');
const path = require('path')
const uuidv1 = require('uuid/v1')

const evidenceURL = config.evidenceURL
const basepath = config.basepath

const running = {}

module.exports = {
  post: (req, res) => post(req, res),
  get: (req, res) => get(req, res),
  running,
};

function enabledExtension(path) {
  if (path.endsWith('.ufdr')) { return true; }
  if (path.endsWith('.dd')) { return true; }
  if (path.endsWith('.raw')) { return true; }
  return false;
}

async function get(req, res) {
  try {
    const path = req.swagger.params.path.value || ''
    const enabled = path.startsWith(basepath) && enabledExtension(path)
    res.json({enabled})
  } catch (error) {
    console.log({error})
    res.status(500).json({message: JSON.stringify(error)})
  }
}

async function post(req, res) {
  try {
    const body = req.swagger.params.body.value;
    const parameters = {
      material: { type: 'number'},
      path: { type: 'string' }
    };
    let onError = false;
    for (const prop in parameters) {
      if (!(prop in body) || (!body[prop])) {
        onError = true
        parameters[prop].error = 'required';
      } else {
        parameters[prop].value = body[prop];
      }
    };
    if (onError) {
      return res.status(400).json({parameters})
    }
    const conditions = {
      material: body.material
    }
    if ('_id' in body) {
      conditions._id = body._id
    }
    const url = evidenceURL + '/api/materials/?' + querystring.stringify({
      conditions: JSON.stringify(conditions)
    })
    const fetched = await fetch(url)
    if (!fetched.ok) {
      console.log({error: fetched})
      return res.status(500).json({
        message: JSON.stringify(fetched)
      })
    }
    const json = await fetched.json()
    if (json.length === 0) {
      parameters.material.error = 'not found'
      return res.status(400).json({parameters})
    }
    if (json.length > 1) {
      parameters.material.error = 'multiple materials found'
      parameters._id = {
        options: json,
        type: 'options',
        error: 'choose one'
      }
      return res.status(400).json({parameters})
    }
    const destination = json[0].path
    await mv(body.path, destination)
    res.json({destination});
  } catch (error) {
    console.log({error})
    res.status(500).json({message: JSON.stringify(error)})
  }
}

function mv (source, destination) {
  const dirDest = path.dirname(destination);
  mkPromise(spawn('mkdir', ['-p', dirDest]))
    .then(() => {
      myid = uuidv1()
      running[myid].command = ['cp', '-n', source, destination]
      running[myid].started = new Date()
      running[myid].status = 'pending'
      p = mkPromise(spawn('cp', ['-n', source, destination]))
      .then(
        (success)=>{
          if (success) {
            console.log({success})
          }
          running[myid].status = 'success'
        },
        (error)=>{
          console.log({error})
          running[myid].status = 'error'
        }
       )
    });
}

function mkPromise(child) {
  const data = ''
  const p = new Promise((resolve, reject) => {
    child.addListener('error', reject)
    child.addListener('close', code => {
      if (code !== 0) {
        reject(data)
      }
      resolve()
    })
  })
  child.stdout.on('data', chunk => {
    data   += chunk
  })
  child.stderr.on('data', chunk => {
    data += chunk
  })
  return p
}
