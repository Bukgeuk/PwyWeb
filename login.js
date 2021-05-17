const API = "http://220.90.237.33:5005"

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

    console.log(res)
    
}