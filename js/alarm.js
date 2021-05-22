let savedPushAlarm

function checkNotificationPromise() {
    try {
      Notification.requestPermission().then();
    } catch(e) {
      return false;
    }

    return true;
}

function askNotificationPermission() {
    // 권한을 실제로 요구하는 함수
    function handlePermission(permission) {
        // 사용자의 응답에 관계 없이 크롬이 정보를 저장할 수 있도록 함
        if(!('permission' in Notification)) {
            Notification.permission = permission;
        }
    
          // 사용자 응답에 따라 단추를 보이거나 숨기도록 설정
        if (Notification.permission === 'denied' || Notification.permission === 'default') {
            alert('브라우저 설정에서 알림을 허용해주셔야 푸시알람 기능 사용 가능합니다')
        } else {
            
        }
    }
  
    // 브라우저가 알림을 지원하는지 확인
    if (!('Notification' in window)) {
        console.log("이 브라우저는 알림을 지원하지 않습니다.");
    } else {
        if(checkNotificationPromise()) {
            Notification.requestPermission()
            .then((permission) => {
                handlePermission(permission);
            })
        } else {
            Notification.requestPermission(function(permission) {
                handlePermission(permission);
            });
        }
    }
}

function isAllowedNotificationPermission() {
    return Notification.permission === 'granted' ? true : false
}

function getUseAlarm() {
    let value = localStorage.getItem('useAlarm')
    if (value === 'true') {
        return true
    } else {
        return false
    }
}

function setUseAlarm(value) {
    localStorage.setItem('useAlarm', value)

    let alarm = document.getElementById('alarm')
    if (value === false) {
        if (alarm.classList.contains('btn-success')) {
            alarm.classList.remove('btn-success')
            alarm.classList.add('btn-danger')
            alarm.textContent = '알람 OFF'

            if (ALARM_TIMER !== undefined) {
                clearInterval(ALARM_TIMER)
                ALARM_TIMER = undefined
            }
        }
    } else if (value === true) {
        if (!isAllowedNotificationPermission()) {
            askNotificationPermission()
        }

        if (alarm.classList.contains('btn-danger')) {
            alarm.classList.remove('btn-danger')
            alarm.classList.add('btn-success')
            alarm.textContent = '알람 ON'
        }

        if (ALARM_TIMER === undefined && isAllowedNotificationPermission()) {
            ALARM_TIMER = setInterval(loadAlarm, 1000 * 60 * 30)
        }
    }
}

function toggleAlarm() {
    setUseAlarm(!getUseAlarm()) 
}

async function loadAlarm() {
    try {
        res = await fetch(`${API}/api/v1/push`, {
            method: 'get',
            headers: {
                'authentication': TOKEN
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
        if (savedPushAlarm === res) return

        savedPushAlarm = res

        let sbo = 0, pin = 0
        for (let item of res) {
            if (item.pageUid === 'Sbobet') sbo++
            else if (item.pageUid === 'Pinnacle') pin++
        }

        let noti = new Notification('새로운 수익률 -2% 이상 경기', { 
            body: `Sbobet ${sbo}건, Pinnacle ${pin}건`
        })
    }
}