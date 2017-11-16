'use strict';
const fetch = require('node-fetch');
const querystring = require('querystring')
const spawn = require('child_process').spawn

const evidenceURL = 'http://iped-queue'

module.exports = {
  post: (req, res) => post(req, res)
};

async function post(req, res) {
  try {
    const body = req.swagger.params.body.value;
    const parameters = {
      material: {},
      path: { hidden: true }
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
      return res.status(400).json(parameters)
    }
    const url = evidenceURL + '/api/materials/?' + querystring.stringify({
      conditions: JSON.stringify({
        material: body.material
      })
    })
    const fetched = await fetch(url)
    if (!fetched.ok) {
      return res.status(500).json({
        message: JSON.stringify(fetched)
      })
    }
    const json = await fetched.json()
    if (json.length === 0) {
      parameters.material.error = 'not found'
      return res.status(400).json(parameters)
    }
    if (json.length > 1) {
      parameters.material.error = 'multiple materials found'
      return res.status(400).json(parameters)
    }
    const destination = json[0].path
    await mv(body.path, destination)
    res.status(204).end()
  } catch (err) {
    res.status(500).json({
      message: err
    })
  }
}

function mv (source, destination) {
  mkPromise(spawn('mkdir', ['-p', destination]))
  .then(() => {
    return mkPromise(spawn('mv', ['-n', source, destination]))
  })
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
