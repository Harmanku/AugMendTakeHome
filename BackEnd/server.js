// 1. Set up Express application
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
require('dotenv').config();
const cors = require('cors'); 



const app = express();
app.use(cors()); 
app.use(bodyParser.json());

const userSchema = new mongoose.Schema({

    loginEmail: { type: String, unique: true, index: true, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    age: { type: Number, required: true },
    maritalStatus: { type: String, required: true },
    otherMaritalStatus: { type: String },
    therapist: { type: String, required: true },
    medications: { type: String, required: true },
    medicationNames: { type: [String], required: true },
});

const UserModel = mongoose.model('User', userSchema);

mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Error connecting to MongoDB:', err));

app.post('/api/surveySubmit', async (req, res) => {
    try {
        //Should do validation here. Don't have time
        const user = new UserModel(req.body);
        console.log(user);
        await user.save();
        res.status(201).send(user);
    } catch (err) {
        console.log(err);
        res.status(400).send(err);
    }
});


app.get('/api/userByEmail', async (req, res) => {
    try {
        const email = req.query.email;
        console.log(email)
        const user = await UserModel.findOne({ loginEmail: email });

        if (!user) {
            
            return res.status(404).send('User not found');

        }
        res.status(200).send(user);
    } catch (err) {
        console.log(err)
        res.status(500).send('Internal Server Error');
    }
});


const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));
