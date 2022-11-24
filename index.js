const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;
require('dotenv').config()
const app = express()
// const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);


app.use(cors())
app.use(express.json())

app.get('/', async (req, res) => {
    res.send('server is running')
})


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.vp0emdq.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        const userCollection = client.db('FlipPhone').collection('user');
        const categoriesCollection = client.db('FlipPhone').collection('categories');

        app.get('/categories', async (req, res) => {
            const query = {}
            const users = await categoriesCollection.find(query).toArray()
            res.send(users)
        })

        app.get('/users', async (req, res) => {
            const query = {}
            const users = await userCollection.find(query).toArray()
            res.send(users)
        })
        app.post('/users', async (req, res) => {
            const user = req.body
            // console.log(user);
            const result = await userCollection.insertOne(user);
            res.send(result)

        })
        app.get('/users/admin/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email }
            const user = await userCollection.findOne(query)
            res.send({ isAdmin: user?.role === 'admin' })
        })
        app.get('/users/seller/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email }
            const user = await userCollection.findOne(query)
            res.send({ isSeller: user?.role === 'seller' })
        })

    }
    finally {

    }
}
run()
    .catch(err => console.log(err))

app.listen(port, () => {
    console.log(`running port is ${port}`)
})