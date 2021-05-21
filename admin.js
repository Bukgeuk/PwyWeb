const API = "http://220.90.237.33:5005"
let ADMINTOKEN

async function adminLogin() {
    let id = document.getElementById('id').value
    let pw = hex_sha512(document.getElementById('pw').value)
    let res, formBody = []

    formBody.push(`id=${encodeURIComponent(id)}`)
    formBody.push(`password=${encodeURIComponent(pw)}`)
    formBody = formBody.join('&')

    try {
        res = await fetch(`${API}/api/v1/admin/login`, {
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
        ADMINTOKEN = res.accessToken

        loadUserList()

        document.getElementById('errmsg').textContent = ''

        document.getElementById('id').value = ''
        document.getElementById('pw').value = ''
        document.getElementById('loginBtn').classList.add('disabled')

        document.getElementById('login').style.display = 'none'
        document.getElementById('logoutBtn').style.display = 'unset'
    }
}

function adminLogout() {
    ADMINTOKEN = undefined
    document.getElementById('login').style.display = 'unset'
    document.getElementById('logoutBtn').style.display = 'none'
}

function toLoginPage() {
    window.location = 'index.html'
}

async function loadUserList() {
    if (!ADMINTOKEN) {
        adminLogout()

        return
    }

    const scroll = document.getElementById('scroll')

    if (scroll.children.length !== 0) {
        while (scroll.lastElementChild) {
            scroll.removeChild(scroll.lastElementChild)
        }
    }

    let res
    try {
        res = await fetch(`${API}/api/v1/admin/auth`, {
            method: 'get',
            headers: {
                'authentication': ADMINTOKEN
            }
        })
        res = await res.json()
    } catch (err) {
        console.log(err)
    }

    if (res.errorCode) {
        if (res.errorCode === 'E302') {
            adminLogout()
            alert('다시 로그인 해주세요')
        }
    } else if (res.user) {
        res.user.sort((a, b) => {
            return a.uid - b.uid
        })

        let gray = false

        for (let i = 0; i < res.user.length; i++) {
            let date = new Date(res.user[i].signUpDate)

            let div = document.createElement('div')
            let span = document.createElement('span')
            let img = document.createElement('img')

            span.textContent = res.user[i].id

            span.setAttribute('title', `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 생성됨`)

            img.src = './asset/close.png'
            img.width = 12
            img.height = 12
            
            img.setAttribute('onclick', `removeUser(${res.user[i].uid})`)

            div.appendChild(span)
            div.appendChild(img)

            div.setAttribute('onmouseenter', `showRemoveBtn(${i})`)
            div.setAttribute('onmouseleave', `hideRemoveBtn(${i})`)

            if (gray) {
                div.style.backgroundColor = '#e5e4e2'
            }

            scroll.appendChild(div)

            gray = !gray
        }
    }
}

function showRemoveBtn(num) {
    let target = document.getElementById('scroll').children[num]
    target.children[1].style.display = 'unset'
}

function hideRemoveBtn(num) {
    let target = document.getElementById('scroll').children[num]
    target.children[1].style.display = 'none'
}

async function removeUser(uid) {
    let res
    try {
        res = await fetch(`${API}/api/v1/admin/auth/${uid}`, {
            method: 'delete',
            headers: {
                'authentication': ADMINTOKEN
            }
        })
        res = await res.json()
    } catch (err) {
        console.log(err)
    }

    if (res.errorCode) {
        if (res.errorCode === 'E108') {
            alert('존재하지 않는 계정입니다')
        } else if (res.errorCode === 'E302') {
            adminLogout()
            alert('다시 로그인 해주세요')
        }
    } else {
        loadUserList()
    }
}

async function createUser() {
    if (!ADMINTOKEN) {
        adminLogout()

        return
    }

    let id = document.getElementById('createAccountModalId').value
    let pw = document.getElementById('createAccountModalPw').value

    if (!id || !pw) return
    else if (pw.length < 8) {
        alert('비밀번호는 최소 8자 이상이어야 합니다')
        return
    }

    let flag1 = false, flag2 = false
    // 알파벳 포함 검사
    for (let i = 0; i < 26; i++) {
        if (pw.indexOf(String.fromCharCode('a'.charCodeAt(0) + i)) !== -1) {
            flag1 = true
            break
        }
    }
    // 숫자 포함 검사
    for (let i = 0; i < 10; i++) {
        if (pw.indexOf(i.toString()) !== -1) {
            flag2 = true
            break
        }
    }
    if (!flag1 || !flag2) {
        alert('비밀번호는 알파벳과 숫자를 포함해야 합니다')
        return
    }

    pw = hex_sha512(pw)

    let res, formBody = []

    formBody.push(`id=${encodeURIComponent(id)}`)
    formBody.push(`password=${encodeURIComponent(pw)}`)
    formBody = formBody.join('&')

    try {
        res = await fetch(`${API}/api/v1/admin/auth`, {
            method: 'post',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'authentication': ADMINTOKEN
            },
            body: formBody
        })
        res = await res.json()
    } catch (err) {
        console.log(err)
    }

    if (res.errorCode) {
        if (res.errorCode === 'E102') {
            alert('이미 존재하는 계정입니다')
        } else if (res.errorCode === 'E302') {
            adminLogout()
            alert('다시 로그인 해주세요')
        }
    } else {
        loadUserList()

        resetCreateAccountInput()
    }
}

function resetCreateAccountInput() {
    document.getElementById('createAccountModalId').value = ''
    document.getElementById('createAccountModalPw').value = ''

    document.getElementById('createAccountModalBtn').classList.remove('disabled')
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

function checkCreateAccountInput() {
    let id = document.getElementById('createAccountModalId').value
    let pw = document.getElementById('createAccountModalPw').value

    if (!id || !pw) {
        document.getElementById('createAccountModalBtn').classList.add('disabled')
    } else {
        document.getElementById('createAccountModalBtn').classList.remove('disabled')
    }
}