const express = require('express');
const app = express();
const morgan = require('morgan');
const cors = require('cors');

app.use(morgan("common"));

app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}))

app.listen(5000, () => {
    console.log("Server up and running on port: 5000");
})