const API = "http://220.90.237.33:5005"
const EVENTS = [
    '축구',
    '농구',
    '야구',
    '테니스',
    '미식-축구',
    '호주식-축구',
    '권투',
    '싸이클',
    '다트',
    'e스포츠',
    '게일릭-풋볼',
    '골프',
    '핸드볼',
    '헐링',
    '아이스-하키',
    '종합-격투기',
    '럭비',
    '탁구',
    '배구',
    '수구']
const SORTS = [
    '날짜순',
    '수익률순'
]
let TOKEN, selectedEvent = '축구', selectedSort = '날짜순', selectedService = 'Sbobet', selectedSubject = ''
let savedId = '', savedPw = ''
let RENEW_TIMER, ALARM_TIMER
let DATA_PIN, DATA_SBO, DATA_ALL

window.addEventListener('DOMContentLoaded', () => {
    let filter = document.getElementById('filter')
    let sort = document.getElementById('sort')

    for (let i = 0; i < EVENTS.length; i++) {
        let span = document.createElement('span')
        span.textContent = EVENTS[i]

        span.setAttribute('onclick', `selectFilter(${i}, \'${EVENTS[i]}\')`)

        filter.appendChild(span)
    }

    filter.children[0].classList.add('option-selected')

    for (let i = 0; i < SORTS.length; i++) {
        let span = document.createElement('span')
        span.textContent = SORTS[i]

        span.setAttribute('onclick', `selectSort(${i}, \'${SORTS[i]}\')`)

        sort.appendChild(span)
    }

    sort.children[0].classList.add('option-selected')

    let alarm = document.getElementById('alarm')
    if (isAllowedNotificationPermission() && getUseAlarm()) {
        alarm.textContent = '알람 ON'
        alarm.classList.add('btn-success')
    } else {
        alarm.textContent = '알람 OFF'
        alarm.classList.add('btn-danger')
    }
})

async function login() {
    let id = document.getElementById('id').value
    let pw = hex_sha512(document.getElementById('pw').value)
    let res, formBody = []

    formBody.push(`id=${encodeURIComponent(id)}`)
    formBody.push(`password=${encodeURIComponent(pw)}`)
    formBody = formBody.join('&')

    try {
        res = await fetch(`${API}/api/v1/login`, {
            method: 'post',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: formBody
        })
        res = await res.json()
    } catch (err) {
        console.log(err)
    }

    if (res.errorCode) {
        let errmsg = document.getElementById('errmsg')
        if (res.errorCode === 'E101') {
            errmsg.textContent = '아이디 또는 비밀번호가 일치하지 않습니다'
            errmsg.style.display = 'unset'
        }
    } else if (res.accessToken) {
        TOKEN = res.accessToken

        let __id = document.getElementById('id')
        let __pw = document.getElementById('pw')
        
        savedId = __id.value
        savedPw = hex_sha512(__pw.value)

        __id.value = ''
        __pw.value = ''

        document.getElementById('errmsg').textContent = ''

        document.getElementById('accountDropdownMenuButton').textContent = id + '님'
        document.getElementById('login').style.display = 'none'
        document.getElementById('accountDropdown').style.display = 'unset'
        document.getElementById('alarm').style.display = 'unset'
        document.getElementById('reload').style.display = 'unset'

        load()

        RENEW_TIMER = setInterval(renew, 1000 * 60 * 60)
        
        if (getUseAlarm() && isAllowedNotificationPermission()) {
            ALARM_TIMER = setInterval(loadAlarm, 1000 * 60 * 30)
        }
    }
}

function toAdminPage() {
    window.location = 'admin.html'
}

function checkLoginInput() {
    let id = document.getElementById('id').value
    let pw = document.getElementById('pw').value

    if (!id || !pw) {
        document.getElementById('loginBtn').classList.add('disabled')
    } else {
        document.getElementById('loginBtn').classList.remove('disabled')
    }
}

function selectFilter(num, event) {
    let filter = document.getElementById('filter')

    for (let item of filter.children) {
        if (item.classList.contains('option-selected')) {
            item.classList.remove('option-selected')
        }
    }

    filter.children[num].classList.add('option-selected')
    selectedEvent = event

    load()
}

function selectSort(num, event) {
    let sort = document.getElementById('sort')

    for (let item of sort.children) {
        if (item.classList.contains('option-selected')) {
            item.classList.remove('option-selected')
        }
    }

    sort.children[num].classList.add('option-selected')
    selectedSort = event

    load()
}

function logout() {
    TOKEN = undefined
    document.getElementById('login').style.display = 'unset'
    document.getElementById('accountDropdown').style.display = 'none'
    document.getElementById('alarm').style.display = 'none'
    document.getElementById('reload').style.display = 'none'

    clearInterval(RENEW_TIMER)
    RENEW_TIMER = undefined
    if (ALARM_TIMER !== undefined) {
        clearInterval(ALARM_TIMER)
        ALARM_TIMER = undefined
    }
}

async function load() {
    try {
        res = await fetch(`${API}/api/v1/post/${selectedEvent}`, {
            method: 'get',
            headers: {
                'authentication': TOKEN,
                'isOrderByOdd': selectedSort === '날짜순' ? false : true
            }
        })
        res = await res.json()
    } catch (err) {
        console.log(err)
    }

    if (res.errorCode) {
        if (res.errorCode === 'E302') {
            logout()
            alert('다시 로그인 해주세요')
        }
    } else {
        DATA_PIN = {}
        DATA_SBO = {}
        DATA_ALL = {}

        for (let item of res) {
            if (item.pageUid === 'Sbobet') {
                if (DATA_SBO[item.subject] === undefined) {
                    DATA_SBO[item.subject] = []
                }

                if (DATA_SBO['모두'] === undefined) {
                    DATA_SBO['모두'] = []
                }

                DATA_SBO[item.subject].push(item)
                DATA_SBO['모두'].push(item)
            } else if (item.pageUid === 'Pinnacle') {
                if (DATA_PIN[item.subject] === undefined) {
                    DATA_PIN[item.subject] = []
                }

                if (DATA_PIN['모두'] === undefined) {
                    DATA_PIN['모두'] = []
                }

                DATA_PIN[item.subject].push(item)
                DATA_PIN['모두'].push(item)
            }

            if (DATA_ALL[item.subject] === undefined) {
                DATA_ALL[item.subject] = []
            }

            if (DATA_ALL['모두'] === undefined) {
                DATA_ALL['모두'] = []
            }

            DATA_ALL[item.subject].push(item)
            DATA_ALL['모두'].push(item)
        }

        let subject = document.getElementById('subject')
        let temp
        if (selectedService === 'Sbobet')
            temp = DATA_SBO
        else if (selectedService === 'Pinnacle')
            temp = DATA_PIN
        else if (selectedService === '모두')
            temp = DATA_ALL

        while (subject.lastElementChild) {
            subject.removeChild(subject.lastElementChild)
        }

        let arr = []
        for (let item in temp)
            arr.push(item)
        arr.sort(subjectSort)

        for (let i = 0; i < arr.length; i++) {
            let span = document.createElement('span')
            span.textContent = arr[i]
    
            span.setAttribute('onclick', `selectSubject(${i}, '${arr[i]}')`)
    
            subject.appendChild(span)
        }
    
        subject.children[0].classList.add('option-selected')
        selectedSubject = subject.children[0].textContent

        listing()
    }
}

function subjectSort(a, b) {
    if (b === '모두') return -1
    else if (a === '모두') return 1
    else if (a < b) return -1
    else if (a > b) return 1
    else return 0
}

async function renew() {
    let res, formBody = []

    formBody.push(`id=${encodeURIComponent(savedId)}`)
    formBody.push(`password=${encodeURIComponent(savedPw)}`)
    formBody = formBody.join('&')

    try {
        res = await fetch(`${API}/api/v1/login`, {
            method: 'post',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: formBody
        })
        res = await res.json()
    } catch (err) {
        console.log(err)
    }

    if (res.errorCode) {
        if (res.errorCode === 'E101') {
            logout()
            alert('다시 로그인해 주세요')
        }
    }
}

function selectService(num, name) {
    let service = document.getElementById('service')

    for (let item of service.children) {
        if (item.classList.contains('option-selected')) {
            item.classList.remove('option-selected')
        }
    }

    service.children[num].classList.add('option-selected')
    selectedService = name

    let subject = document.getElementById('subject')
    let temp
    if (selectedService === 'Sbobet')
        temp = DATA_SBO
    else if (selectedService === 'Pinnacle')
        temp = DATA_PIN
    else if (selectedService === '모두')
        temp = DATA_ALL

    while (subject.lastElementChild) {
        subject.removeChild(subject.lastElementChild)
    }

    let arr = []
    for (let item in temp)
        arr.push(item)
    arr.sort(subjectSort)

    for (let i = 0; i < arr.length; i++) {
        let span = document.createElement('span')
        span.textContent = arr[i]

        span.setAttribute('onclick', `selectSubject(${i}, '${arr[i]}')`)

        subject.appendChild(span)
    }

    subject.children[0].classList.add('option-selected')
    selectedSubject = subject.children[0].textContent

    listing()
}

function selectSubject(num, name) {
    let subject = document.getElementById('subject')

    for (let item of subject.children) {
        if (item.classList.contains('option-selected')) {
            item.classList.remove('option-selected')
        }
    }

    subject.children[num].classList.add('option-selected')
    selectedSubject = name

    listing()
}

function listing() {
    let temp
    if (selectedService === 'Sbobet')
        temp = DATA_SBO
    else if (selectedService === 'Pinnacle')
        temp = DATA_PIN
    else if (selectedService === '모두')
        temp = DATA_ALL

    let scroll = document.getElementById('scroll')
    
    while (scroll.lastElementChild) {
        scroll.removeChild(scroll.lastElementChild)
    }

    for (let item of temp[selectedSubject]) {
        let div = document.createElement('div')

        let span = document.createElement('span')
        span.textContent = item.pageUid
        div.appendChild(span)

        span = document.createElement('span')
        let date = new Date(item.doDate)
        let hour = date.getHours().toString()
        if (Number(hour) < 10 && hour.length === 1)
            hour = '0' + hour
        let minute = date.getMinutes().toString()
        if (Number(minute) < 10 && minute.length === 1)
            minute = '0' + minute

        span.textContent = `${date.getMonth() + 1}월 ${date.getDate()}일 ${hour}:${minute}`
        div.appendChild(span)

        span = document.createElement('span')
        span.textContent = `${item.first} - ${item.second}`
        div.appendChild(span)

        span = document.createElement('span')
        span.textContent = item.odd1
        div.appendChild(span)

        span = document.createElement('span')
        span.textContent = item.odd3 === -1 ? '-' : item.odd3
        div.appendChild(span)

        span = document.createElement('span')
        span.textContent = item.odd2
        div.appendChild(span)

        span = document.createElement('span')
        span.textContent = item.margin
        div.appendChild(span)

        span = document.createElement('span')
        span.textContent = item.subject
        div.appendChild(span)

        scroll.appendChild(div)
    }
}