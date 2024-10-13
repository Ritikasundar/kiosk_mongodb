const express = require('express');
const path = require('path');
const {MongoClient,ObjectId}=require('mongodb');
const passport = require('passport');
const Auth0Strategy = require('passport-auth0');
const session = require('express-session');

require('dotenv').config();
//npm install passport passport-auth0 express-session npm install dotenv


const app = express();
const port = 3000;

const uri = "mongodb+srv://ritika:ritika23@cluster0.ethop.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

const client = new MongoClient(uri);

const strategy = new Auth0Strategy(
    {
      domain: process.env.AUTH0_DOMAIN,
      clientID: process.env.AUTH0_CLIENT_ID,
      clientSecret: process.env.AUTH0_CLIENT_SECRET,
      callbackURL: process.env.AUTH0_CALLBACK_URL
    },
    function (accessToken, refreshToken, extraParams, profile, done) {
      return done(null, profile);
    }
  );
  
  passport.use(strategy);
  passport.serializeUser((user, done) => done(null, user));
  passport.deserializeUser((user, done) => done(null, user));

  app.use(session({ secret: process.env.SESSION_SECRET, resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

app.get('/login', passport.authenticate('auth0', { scope: 'openid email profile' }), (req, res) => {
    res.redirect('/');
  });
  
  app.get('/callback', passport.authenticate('auth0', { failureRedirect: '/' }), (req, res) => {
    res.redirect('/');
  });
  
  app.get('/logout', (req, res) => {
    req.logout(() => {
      res.redirect(`https://${process.env.AUTH0_DOMAIN}/v2/logout?client_id=${process.env.AUTH0_CLIENT_ID}&returnTo=http://localhost:3000`);
    });
  });
  

client.connect()
.then(()=>{
    console.log("connected");
})
.catch((err)=>{
console.log("error:"+err);
})

app.use(express.static(path.join(__dirname,'public')));
app.use(express.json());

app.get('/',(req,res)=>{
    res.sendFile(path.join(__dirname,'public','index.html'));
})

app.post('/add-food',async (req,res)=>{
    const {name,cost} = req.body;

    const db = client.db('kiosk');
    const collection = db.collection('menu');

    try{
        await collection.insertOne({name,cost});
        res.json({message:"inserted"});
    }
    catch(err)
    {
        console.error('Error adding food item:', err);
        res.status(500).json({ message: 'Internal server error' });

    }
})

app.get('/get-food',async(req,res)=>{
    const db = client.db('kiosk');
    const collection = db.collection('menu');

    try{
        const foodItems = await collection.find().toArray();
        res.json(foodItems);
    }
    catch (err) {
        console.error('Error fetching food items:', err);
        res.status(500).json({ message: 'Internal server error' });
    }

})

app.post('/update-food/:id',async(req,res)=>{
    const {id} = req.params;
    const {name,cost} = req.body;
    const db = client.db('kiosk');
const collection = db.collection('menu');

try{
    await collection.updateOne(
        {
            _id:new ObjectId(id),
        },
        {
            $set:{name:name,cost:cost}

        }
    );
    res.status(200).json({ message: 'Food item updated' });}
    catch (err) {
        console.error('Error updating food item:', err);
        res.status(500).json({ message: 'Internal server error' });
    }


})

app.delete('/delete-food/:id', async (req, res) => {
    const { id } = req.params;

    const db = client.db('kiosk');
    const collection = db.collection('menu');

    try {
        await collection.deleteOne({ _id: new ObjectId(id) });
        res.status(200).json({ message: 'Food item deleted' });
    } catch (err) {
        console.error('Error deleting food item:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
});




app.listen(port,()=>{
    console.log("listening");
})