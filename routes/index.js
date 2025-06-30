const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    req.db.query('select * from Operations', (err, results) => {
        if (err) throw err;
        res.render('index', { visitors: results });
    });
});

/* router.post('/add', (req, res) => {
    const { name } = req.body;
    req.db.query('INSERT INTO visitors (name) VALUES (?)', [name], (err) => {
        if (err) throw err;
        res.redirect('/');
    });
}); */

module.exports = router;
