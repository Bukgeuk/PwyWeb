const API = "http://220.90.237.33:5005"
let TOKEN

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

        document.getElementById('login').style.display = 'none'
    }
}

function toAdminPage() {
    window.location = 'admin.html'
}