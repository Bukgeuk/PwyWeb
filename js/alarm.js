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
    if (alarm.classList.contains('btn-success')) {
        alarm.classList.remove('btn-success')
        alarm.classList.add('btn-danger')
        alarm.textContent = '알람 OFF'
    } else if (alarm.classList.contains('btn-danger')) {
        if (!isAllowedNotificationPermission()) {
            askNotificationPermission()
        }

        if (isAllowedNotificationPermission()) {
            alarm.classList.remove('btn-danger')
            alarm.classList.add('btn-success')
            alarm.textContent = '알람 ON'
        }  
    }
}

function toggleAlarm() {
    setUseAlarm(!getUseAlarm()) 
}