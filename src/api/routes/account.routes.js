const express = require('express')

module.exports = function(server){

    //API routes
    const router = express.Router()
    server.use('/api', router)

    const accountController = require('../controllers/account.controller')
    
    accountController.register(router, '/account')
}