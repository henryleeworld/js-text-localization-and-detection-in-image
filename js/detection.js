var input = document.getElementById('input')
var inputOverlay = document.getElementById('input-overlay')
var ioctx = inputOverlay.getContext('2d')
var outputText = document.getElementById('log')

var instructions = document.getElementById('instructions')

var dropInstructions = [].slice.call(document.querySelectorAll('.drop-instructions'))
var options = [].slice.call(document.querySelectorAll('.option'))

var language = 'eng'
var started = false
var languageImages = {
    eng: 'images/eng.jpg',
    chi_tra: 'images/chi_tra.jpg',
}

var languageInstructions = {
    eng: '一個英文',
    chi_tra: '一個中文',
}

var worker = new Tesseract.createWorker({
    logger: progressUpdate,
});

function setUp() {
    inputOverlay.width = input.naturalWidth
    inputOverlay.height = input.naturalHeight

    outputText.style.height = input.height + 'px'
}

setUp()
input.onload = setUp

function isOutputVisible() {
    return outputText.getBoundingClientRect().top < dimensions.height
}

function startIfVisible(argument) {
    if (isOutputVisible() && !started) start();
}

function start() {
    started = true

    async function start() {
        await worker.load();
        await worker.loadLanguage('eng');
        await worker.initialize('eng');
        const {
            data
        } = await worker.recognize(input);
        result(data);

        input.removeEventListener('load', start)
    }

    if (input.complete) start();
    else input.addEventListener('load', start)
}

function progressUpdate(packet) {
    var log = document.getElementById('log');

    if (log.firstChild && log.firstChild.status === packet.status) {
        if ('progress' in packet) {
            var progress = log.firstChild.querySelector('progress')
            progress.value = packet.progress
        }
    } else {
        var line = document.createElement('div');
        line.status = packet.status;
        var status = document.createElement('div')
        status.className = 'status'
        status.appendChild(document.createTextNode(packet.status))
        line.appendChild(status)

        if ('progress' in packet) {
            var progress = document.createElement('progress')
            progress.value = packet.progress
            progress.max = 1
            line.appendChild(progress)
        }


        if (packet.status == 'done') {
            var pre = document.createElement('pre')
            pre.appendChild(document.createTextNode(packet.data.text))
            line.innerHTML = ''
            line.appendChild(pre)

        }

        log.insertBefore(line, log.firstChild)
    }
}

function result(res) {
    console.log('result was:', res)

    progressUpdate({
        status: 'done',
        data: res
    })

    res.words.forEach(function(w) {
        var b = w.bbox;

        ioctx.strokeWidth = 2

        ioctx.strokeStyle = 'red'
        ioctx.strokeRect(b.x0, b.y0, b.x1 - b.x0, b.y1 - b.y0)
        ioctx.beginPath()
        ioctx.moveTo(w.baseline.x0, w.baseline.y0)
        ioctx.lineTo(w.baseline.x1, w.baseline.y1)
        ioctx.strokeStyle = 'green'
        ioctx.stroke()
    })
}

document.addEventListener('scroll', startIfVisible)
startIfVisible()

function clearOverLayAndOutput() {
    ioctx.clearRect(0, 0, inputOverlay.width, inputOverlay.height)

    outputText.style.display = 'none'

    instructions.style.display = 'block'
}


async function play() {

    instructions.style.display = 'none'
    outputText.style.display = 'block'
    outputText.innerHTML = ''

    await worker.load();
    await worker.loadLanguage(language);
    await worker.initialize(language);
    const {
        data
    } = await worker.recognize(input);
    result(data);
}

options.forEach(function(option) {
    option.addEventListener('click', function() {

        clearOverLayAndOutput()

        dropInstructions.forEach(function(di) {
            di.innerHTML = languageInstructions[option.lang]
        })

        language = option.lang

        options.forEach(function(option) {
            option.className = 'option'
        })
        option.className = 'option selected'
        if (option.lang in languageImages) {
            input.src = languageImages[option.lang]
        }
    })
})

document.body.addEventListener('drop', async function(e) {
    e.stopPropagation();
    e.preventDefault();
    var file = e.dataTransfer.files[0]
    var reader = new FileReader();
    reader.onload = function(e) {
        input.src = e.target.result;
        input.onload = function() {
            setUp();
        }
    };
    reader.readAsDataURL(file);
    await worker.load();
    await worker.loadLanguage(language);
    await worker.initialize(language);
    const {
        data
    } = await worker.recognize(file);
    result(data);
})

document.getElementsByClassName('option selected')[0].click();