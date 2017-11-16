var mockSpawn = require('mock-spawn');
const mySpawn = mockSpawn();
require('child_process').spawn = mySpawn;
mySpawn.setStrategy((command, args, opts) => {
  if (require.main === module) {
    console.log(command, args, opts)
  }
  return mySpawn.simple(0)
})
require('./app')
module.exports = mySpawn
