const mongoose = require('mongoose');
require('dotenv').config('../.env');

mongoose.connect(`mongodb+srv://harendraseervi1234:${process.env.PASS}@cluster0.ighny9l.mongodb.net/oneprofile`);
