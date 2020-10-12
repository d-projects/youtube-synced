const { render } = require('ejs');
const express = require('express');
const app = express();

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.listen(3000, () => {
    console.log('working');
});

app.get('/', (req, res) => {
    res.render('index');
});

app.post('/watch', (req, res) => {
    res.render('watch');
})



