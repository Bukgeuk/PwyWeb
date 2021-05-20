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
let TOKEN, selectedEvent = '축구', selectedSort = '날짜순'

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
    if (isAllowedNotificationPermission()) {
        alarm.textContent = '알람 ON'
        alarm.classList.add('btn-success')
    } else {
        alarm.textContent = '알람 OFF'
        alarm.classList.add('btn-danger')
    }
})

async function login() {
    let id = document.getElementById('id').value
    let pw = document.getElementById('pw').value
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

        document.getElementById('id').value = ''
        document.getElementById('pw').value = ''

        document.getElementById('errmsg').textContent = ''

        document.getElementById('accountDropdownMenuButton').textContent = id + '님'
        document.getElementById('login').style.display = 'none'
        document.getElementById('accountDropdown').style.display = 'unset'
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
}

function logout() {
    TOKEN = undefined
    document.getElementById('login').style.display = 'unset'
    document.getElementById('accountDropdown').style.display = 'none'
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
    }

    
}