import express from 'express';
import controller from './controller'
export default express.Router()
    .ws('/controller', controller.controller)
    .get('/usage', controller.usage)
    .get('/', controller.all)
    ;