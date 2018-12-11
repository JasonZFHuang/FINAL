require('dotenv').config()
const express = require('express')
const hbs = require('hbs')
const bodyParser = require('body-parser')
const request = require('request')


const port = process.env.PORT || 8080
const app = express()


/* Middlewares */

app.set('view engine', 'hbs')

hbs.registerPartials(`${__dirname}/views/partials`)

app.use(express.static(__dirname + '/public'))

/* Bodyparser Middlewares */
app.use(bodyParser.urlencoded({
  extended: true
}))
app.use(bodyParser.json())


/* Functions */
const fetchImg = (keyword) => {
  return new Promise((resolve, reject) => {
    request({
      url: `https://pixabay.com/api/?key=${process.env.PIXABAY_KEY}&q=${encodeURI(keyword)}`,
      json: true
    }, (error, response, body) => {
      if (error) {
        reject(error)
      }
      resolve(body.hits.map(el => el.previewURL))
    })
  })

}

const fetchWeather = (location) => {
  return new Promise((resolve, reject) => {
    fetchLocation(location)
      .then(val => {
        let lat = val[0]
        let lng = val[1]
        request({
          uri: `https://api.darksky.net/forecast/${process.env.DARKSKY_KEY}/${lat},${lng}`,
          json: true
        }, (error, response, body) => {
          if (error) {
            reject(error)
          }
          resolve(body.currently)
        })
      })
      .catch(err => reject(err))
  })
}

const fetchLocation = (location) => {
  return new Promise((resolve, reject) => {
    request({
      url: `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURI(location)}&key=${process.env.GEOCODE_KEY}`,
      json: true
    }, (error, response, body) => {
      if (error) {
        reject(error)
      }
      resolve([body.results[0].geometry.location.lat, body.results[0].geometry.location.lng])
    })
  })

}


/* HTTP REQUESTS */
/* GET */
app.get('/', (req, res) => {
  res.render('index.hbs')
})

app.get('/fetch', (req, res) => {
  res.render('fetch.hbs')
})

app.get('/weather', (req, res) => {
  res.render('weather.hbs')
})
/* POST */
app.post('/searchImg', (req, res) => {
  let keyword = req.body.search
  fetchImg(keyword)
    .then(val => res.render("fetch.hbs", {
      images: val
    }))
    .catch(val => res.render("fetch.hbs"))
})

app.post('/searchWeather', (req, res) => {
  let keyword = req.body.search
  fetchWeather(keyword)
    .then(val => {
      return val
    })
    .then(val => {
      fetchImg(val.icon + ' icon')
        .then(img => {
          console.log(val)
          res.render('weather.hbs', {
            stats: val,
            icon: img[0]
          })
        })
    })
    .catch(val => res.render("weather.hbs"))
})

/* Start Server */
app.listen(port, console.log(`Server is up on the port ${port}, with PID: ${process.pid}`))
