const API = "https://teamks.pw:5005"
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
let RENEW_TIMER, ALARM_TIMER, RELOAD_TIMER
let DATA_PIN, DATA_SBO, DATA_ALL
let loading = false, left_reload = 60 * 5

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
        updateReloadBtnContent()
        RELOAD_TIMER = setInterval(autoReload, 1000)
        
        if (getUseAlarm() && isAllowedNotificationPermission()) {
            ALARM_TIMER = setInterval(loadAlarm, 1000 * 60 * 10)
        }
    }
}

function toAdminPage() {
    window.location = 'admin.html'
}

function checkLoginInput(event) {
    let id = document.getElementById('id').value
    let pw = document.getElementById('pw').value

    if (!id || !pw) {
        document.getElementById('loginBtn').classList.add('disabled')
    } else {
        document.getElementById('loginBtn').classList.remove('disabled')

        if (event.code === "Enter") {
            login()
        }
    }
}

function selectFilter(num, event) {
    if (loading) return

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
    if (loading) return

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
    clearInterval(RELOAD_TIMER)
    RELOAD_TIMER = undefined
    if (ALARM_TIMER !== undefined) {
        clearInterval(ALARM_TIMER)
        ALARM_TIMER = undefined
    }
}

async function load() {
    if (loading) return
    setLoading(true)

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
        setLoading(false)

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
    
        if (subject.children.length > 0) {
            subject.children[0].classList.add('option-selected')
            selectedSubject = subject.children[0].textContent
        }

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
    if (loading) return

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

    if (subject.children.length > 0) {
        subject.children[0].classList.add('option-selected')
        selectedSubject = subject.children[0].textContent
    }

    listing()
}

function selectSubject(num, name) {
    if (loading) return

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
    if (loading) return

    let temp
    if (selectedService === 'Sbobet')
        temp = DATA_SBO
    else if (selectedService === 'Pinnacle')
        temp = DATA_PIN
    else if (selectedService === '모두')
        temp = DATA_ALL

    let scroll = document.getElementById('scroll')
    
    while (scroll.lastElementChild) {
        if (scroll.children.length === 1 && scroll.lastElementChild.id === 'loading') break
        scroll.removeChild(scroll.lastElementChild)
    }

    if (temp[selectedSubject] === undefined) {
        let div = document.createElement('div')
        let span = document.createElement('span')
        span.textContent = "데이터가 없음"
        span.style.width = "100%"
        span.style.fontSize = "1.3rem"
        span.style.padding = "50px"
        div.appendChild(span)
        scroll.appendChild(div)

        return
    }

    for (let item of temp[selectedSubject]) {
        let div = document.createElement('div')

        let span = document.createElement('span')
        span.textContent = item.pageUid
        div.appendChild(span)

        span = document.createElement('span')
        let td1 = document.createElement('div')
        let td2 = document.createElement('div')

        let sp = item.doDate.split(' ')
        let date = sp[0].split('-')
        if (date[1][0] === '0') date[1] = date[1].substr(1)
        let time = sp[1].split(':')
        td1.textContent = `${date[1]}월 ${date[2]}일 ${time[0]}:${time[1]}`
        td1.title = '경기 날짜'

        {
            let msec = (new Date()).getTime() - (new Date(item.crawlDate)).getTime()
            let sec = parseInt(msec / 1000)
            let min = parseInt(sec / 60)
            let hour = parseInt(min / 60)

            sec %= min
            min %= hour

            let str = ""
            if (hour !== 0)
                str += `${hour}시간 `
            if (min !== 0)
                str += `${min}분 `
            if (str === "")
                str += `${sec}초 `

            td2.textContent = `${str} 전`
        }
        td2.title = '크롤링 시간'

        span.appendChild(td1)
        span.appendChild(td2)
        div.appendChild(span)

        span = document.createElement('span')
        td1 = document.createElement('div')
        td2 = document.createElement('div')
        td1.textContent = `${item.first} - ${item.second}`
        td2.textContent = item.game
        span.appendChild(td1)
        span.appendChild(td2)
        div.appendChild(span)

        span = document.createElement('span')
        if (item.firstname && item.firstname !== "undefined") {
            td1 = document.createElement('div')
            td2 = document.createElement('div')
            td1.textContent = item.firstname
            td2.textContent = item.odd1
            span.appendChild(td1)
            span.appendChild(td2)
        } else {
            span.textContent = item.odd1
        }
        div.appendChild(span)

        span = document.createElement('span')
        td1 = document.createElement('div')
        td2 = document.createElement('div')
        if (item.secondname && item.secondname !== "undefined") {
            td1.textContent = item.secondname
            td2.textContent = item.odd2
            span.appendChild(td1)
            span.appendChild(td2)
        } else {
            span.textContent = item.odd2
        }
        div.appendChild(span)

        span = document.createElement('span')
        span.textContent = item.margin
        div.appendChild(span)

        span = document.createElement('span')
        sp = item.subject.split(' – ')
        if (sp.length === 1) {
            span.textContent = item.subject
        } else {
            td1 = document.createElement('div')
            td2 = document.createElement('div')
            td1.textContent = sp[0]
            td2.textContent = `(${sp[1]})`
            span.appendChild(td1)
            span.appendChild(td2)
        }    
        div.appendChild(span)

        scroll.appendChild(div)
    }
}

function setLoading(value) {
    loading = value
    let element = document.getElementById('loading')
    if (value === true) {
        let scroll = document.getElementById('scroll')
        while (scroll.lastElementChild) {
            if (scroll.children.length === 1 && scroll.lastElementChild.id === 'loading') break
            scroll.removeChild(scroll.lastElementChild)
        }

        element.classList.add('d-flex', 'justify-content-center')
        element.style.display = 'unset'
    } else if (value === false) {
        element.classList.remove('d-flex', 'justify-content-center')
        element.style.display = 'none'
    }
}

function updateReloadBtnContent() {
    document.getElementById('reload').textContent = `새로고침(${left_reload})`
}

async function autoReload() {
    if (left_reload > 0) {
        left_reload--
        updateReloadBtnContent()
    } else if (left_reload === 0) {
        left_reload = 60 * 5
        updateReloadBtnContent()

        const currentEvent = selectedEvent
        const currentSubject = selectedSubject

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
            if (selectedEvent != currentEvent) return

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
        
            let flag = false
            for (let i = 0; i < subject.children.length; i++) {
                if (subject.children[i].textContent === currentSubject) {
                    subject.children[i].classList.add('option-selected')
                    selectedSubject = currentSubject
                    flag = true
                    break
                }
            }

            if (subject.children.length > 0 && !flag) {
                subject.children[0].classList.add('option-selected')
                selectedSubject = subject.children[0].textContent
            }

            listing()
        }
    }
}
