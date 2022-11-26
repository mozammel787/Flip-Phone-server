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

const verifyJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: 'unauthorized access' })
    }
    const token = authHeader.split(' ')[1]

    jwt.verify(token, process.env.ACCESS_TOKEN_kye, function (err, decode) {
        if (err) {
            return res.status(403).send({ message: 'forbidden access' })
        }
        req.decode = decode;
        next()
    })
}

async function run() {
    try {
        const userCollection = client.db('FlipPhone').collection('user');
        const categoriesCollection = client.db('FlipPhone').collection('categories');
        const productsCollection = client.db('FlipPhone').collection('products');

        app.get('/jwt', async (req, res) => {
            const email = req.query.email
            const query = { email: email };
            const user = await userCollection.findOne(query)
            if (user) {
                const token = jwt.sign({ email }, process.env.ACCESS_TOKEN_kye, { expiresIn: '7d' })
                return res.send({ geniusToken: token })
            }
            res.status(403).send({ geniusToken: '' })
        })

        const verifyAdmin = async (req, res, next) => {
            const decodedEmail = req.decode.email;
            // console.log(res.decode);
            const query = { email: decodedEmail };
            const user = await userCollection.findOne(query);
            if (user?.role !== 'admin') {
                return res.status(403).send({ message: 'forbidden Access' })
            }
            next()

        }
        // const verifySeller = async (req, res, next) => {
        //     const decodedEmail = req.decode.email;
        //     console.log(res.decode);
        //     const query = { email: decodedEmail };
        //     const user = await userCollection.findOne(query);
        //     if (user?.role !== 'seller') {
        //         return res.status(403).send({ message: 'forbidden Access' })
        //     }
        //     next()

        // }

        app.get('/categories', async (req, res) => {
            const query = {}
            const users = await categoriesCollection.find(query).toArray()
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
            res.send({ isSellerOrAdmin:( user?.role === 'seller'||user?.role === 'admin' ) })
        })
        app.get('/verify/seller/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email }
            const user = await userCollection.findOne(query)
            res.send({ isVerify: user.verified === true })
        })
        app.get('/sellers', verifyJWT, verifyAdmin, async (req, res) => {
            const role = "seller";
            const query = { role: role }
            const user = await userCollection.find(query).toArray()
            res.send(user)
        })
        app.put('/sellers/:id', verifyJWT, verifyAdmin, async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const options = { upsert: true }
            const updateDoc = {
                $set: {
                    verified: true
                }
            }
            const result = await userCollection.updateOne(filter, updateDoc, options)
            res.send(result)
        })
        app.delete('/sellers/:id', verifyJWT, verifyAdmin, async (req, res) => {
            const id = req.params.id
            const query = { _id: ObjectId(id) }
            const result = await userCollection.deleteOne(query)
            res.send(result)
        })
        app.get('/buyers', verifyJWT, verifyAdmin, async (req, res) => {
            const role = "";
            const query = { role: role }
            const user = await userCollection.find(query).toArray()
            res.send(user)
        })
        app.delete('/buyers/:id', verifyJWT, verifyAdmin, async (req, res) => {
            const id = req.params.id
            const query = { _id: ObjectId(id) }
            const result = await userCollection.deleteOne(query)
            res.send(result)
        })

        app.post('/addproduct', verifyJWT, async (req, res) => {
            const user = req.body
            const result = await productsCollection.insertOne(user);
            res.send(result)

        })
        app.get('/product', verifyJWT, async (req, res) => {
            const email = req.query.email;
            // console.log(req.decode);
            const decodedEmail = req.decode.email;
            if (!email === decodedEmail) {
                return res.status(403).send({ message: 'forbidden access' })
            }
            const query = { sellerEmail: email };
            const product = await productsCollection.find(query).toArray()
            res.send(product)
        })
        app.delete('/product/:id', verifyJWT, async (req, res) => {
            const id = req.params.id
            const query = { _id: ObjectId(id) }
            const result = await productsCollection.deleteOne(query)
            res.send(result)
        })
        app.put('/product/:id', verifyJWT, async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) }
            const options = { upsert: true }
            const updatedDoc = {
                $set: {
                    advertisement: true
                }
            }
            const result = await productsCollection.updateOne(filter, updatedDoc, options)
            res.send(result)
        })
        app.get('/advertisement', async (req, res) => {
            const advertisement = true;
            const query = { advertisement: advertisement }
            const user = await productsCollection.find(query).sort({ "postTime": -1 }).toArray()
            res.send(user)
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