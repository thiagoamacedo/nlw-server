import express from 'express'

const app = express()

app.get('/ads', (request, response) => {
  return response.json([ 
    { id: 1, title: 'Ad 1' }, 
    { id: 2, title: 'Ad 2' },
    { id: 3, title: 'Ad 3' },
    { id: 4, title: 'Ad 4' },
  ])
})

app.listen(3333)