const parseString = require('xml2js').parseString;
const stringify = require('csv-stringify');
const fs = require('fs')

const readXML = (filename) => new Promise((resolve, reject) =>
    fs.readFile(__dirname + '/doc.kml', (err, result) => err ? reject(err) : resolve(result))
)

const parse = (xml) => new Promise((resolve, reject) =>
    parseString(xml, { explicitArray: false }, (err, result) => err ? reject(err) : resolve(result))
)

const toDate = (string) => new Date(Date.parse(string)).toLocaleString()

const parseDescription = (description) => {
    let array = description.split(' ')
    let method = array[1]
    let from = toDate(array[3])
    let to = toDate(array[5].slice(0, -1))
    let distance = array[7]
    return { method, from, to, distance }
}

const extractPlaces = (element, index, array) => {
    let res = parseDescription(element.description)
    return {
        place: element.name,
        method: res.method,
        from: res.from,
        to: res.to,
        distance: res.distance
    }
}

const getDay = (obj, element, index, array) => (element.method == 'Driving') ?
    [...obj, [array[index - 1]['place'], array[index + 1]['place'], element.from, element.to, element.distance]] : obj

const createCSV = day => new Promise((resolve, reject) =>
    stringify(day, (err, res) => err ? reject(err) : resolve(res))
)

const main = async (filename = 'doc.kml') => {
    try {
        let xml = await readXML(filename)
        let json = await parse(xml)
        let trip = json.kml.Document['Placemark'].map(extractPlaces)
        let day = trip.reduce(getDay, [])
        let csv = await createCSV(day)

        console.log(csv)
    }
    catch (error) {
        console.error(error)
    }
}

main()