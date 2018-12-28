const action = require('./action')

const get = (req, res) => {
    return res.json({running: action.running})
}

module.exports = {
    get,
}
