import express from 'express';
import controller from './controller'
export default express.Router()
    .get('/', controller.all)
    .post('/', controller.create)
    .get('/:id', controller.byId)
    .delete('/:id', controller.delete)
    .put('/:id', controller.update)
    ;