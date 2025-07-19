require('dotenv').config();
const express = require('express');
const app = express();
const mysql = require('mysql2');
const path = require('path');
const session = require('express-session');

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: false }));
app.use(session({
    secret: 'aractakip',
    resave: false,
    saveUninitialized: true
}))

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

db.connect((err) => {
    if (err) {
        console.error('Veritabanı bağlantısı başarısız: ' + err.message);
        return;
    }
    console.log('Veritabanına bağlandı!');
});

app.use((req, res, next) => {
    req.db = db;
    next();
});

/* app.use('/', routes); */
app.get('/', async (req, res) => {
    const arac_sayisi = await db.promise().query('SELECT COUNT(*) AS arac_sayisi FROM Cars', []);
    const araclar = await db.promise().query('SELECT *  FROM Cars', []);
    const islem_turleri = await db.promise().query('SELECT *  FROM Operations', []);
    const islemler = await db.promise().query(`SELECT 
    DATEDIFF( P.yapilacak_tarih,CURRENT_DATE()) AS kalan_gun,
	P.id as islem_id,P.fiyat as fiyat,P.yapilacak_tarih as yapilacak_tarih,P.yapilan_tarih
    ,C.marka as marka, C.plaka as plaka, C.yıl
    ,O.OperationName
    ,P.sonraki_km
    ,C.km arac_km
    ,P.sonraki_km - C.km as kalan_km
FROM 
    Process P 
LEFT JOIN 
    Cars C ON P.arac_id = C.id 
LEFT JOIN 
    Operations O ON P.islem_id = O.Id
WHERE P.bitti = 0;`, []);
    db.query('SELECT * FROM Operations', (err, results) => {
        if (err) throw err;
        res.render('index', { visitors: results, title: "Ana Sayfa ⌛", arac_sayisi: arac_sayisi[0][0].arac_sayisi, araclar: araclar[0], islem_turleri: islem_turleri[0], islemler: islemler[0] });
    });
});

app.get("/cars", (req, res) => {
    db.query('SELECT * FROM Cars', (err, results) => {
        if (err) throw err;
        res.render("cars", { title: "Araçlarım ✨", cars: results/* , session: req.session  */ });
    });
});

app.post("/add-car", (req, res) => {
    db.query("Insert into Cars (marka, plaka, yıl,km) values (?, ?, ?,?)", [req.body.marka, req.body.plaka, req.body.yıl, req.body.km], (err, result) => {
        if (err) throw err;
        console.log("Araç eklendi");
    });
    res.redirect("/cars");
});

app.post("/delete-car/:id", (req, res) => {
    db.query("Delete from Cars where id = ?", [req.params.id], (err, result) => {
        if (err) throw err;
        console.log("Araç silindi");
    });
    res.redirect("/cars");
});

app.get("/get-car/:id", (req, res) => {
    db.query("Select * from Cars where id = ?", [req.params.id], (err, result) => {
        if (err) throw err;
        res.render("car", { title: "Araç Bilgileri 💢", car: result[0] });
    });
});

app.post("/edit-car/:id", (req, res) => {
    db.query("Update Cars set marka = ?, plaka = ?, yıl = ?, km = ? where id = ?", [req.body.marka, req.body.plaka, req.body.yıl, req.body.km, req.params.id], (err, result) => {
        if (err) throw err;
        console.log("Araç güncellendi");
    });
    res.redirect("/cars");
})

app.post("/add-operation", (req, res) => {
    db.query("Insert into Process (arac_id, islem_id, yapilan_tarih,yapilacak_tarih, fiyat,sonraki_km) values (?,?,?,?,?,?)", [req.body.arac_id, req.body.islem_id, req.body.yapilan_tarih, req.body.yapilacak_tarih, req.body.fiyat, req.body.sonraki_km], (err, result) => {
        if (err) throw err;
        res.redirect("/");
    })
})

app.post("/delete-operation/:id", (req, res) => {
    db.query("Delete from Process where id =?", [req.params.id], (err, result) => {
        if (err) throw err;
        console.log("İşlem silindi");
    });
    res.redirect("/");
})

app.get("/operations", (req, res) => {
    db.query('SELECT * FROM Operations', (err, results) => {
        if (err) throw err;
        res.render("operations", { title: "İşlem Türleri 🌐", operations: results });
    });
});

app.post("/operations", (req, res) => {
    db.query("Insert into Operations (OperationName,OperationGroup) values (?,?)", [req.body.OperationName, req.body.OperationGroup], (err, result) => {
        if (err) throw err;
        console.log("İşlem eklendi");
    });
    res.redirect("/operations");
});

app.get("/delete-operation-card/:id", (req, res) => {
    db.query("Delete from Operations where Id =?", [req.params.id], (err, result) => {
        if (err) throw err;
        console.log("İşlem silindi");
    });
    res.redirect("/operations");
})

app.post("/done-operation/:id", (req, res) => {
    db.query("Update Process set bitti =? where id =?", [true, req.params.id], (err, result) => {
        if (err) throw err;
        console.log("İşlem güncellendi");
    });
    res.redirect("/");
})

app.get("/old-operations", (req, res) => {
    res.render("old-operations", { title: "Geçmiş İşlemler 📅" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server çalışıyor http://localhost:${PORT}`));