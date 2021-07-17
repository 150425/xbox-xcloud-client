var app = null

window.addEventListener('load', (event) => {

    app = {
        client: null,

        isDebugMenuOpen: false,

        views: [
            'consolesListView',
            'streamingView',
            'testView'
        ],

        init: function() {
            this.client = new xCloudClient()

            app.openConsoleView()

            // Video resizer (if active)
            window.addEventListener('resize', () => {
                if(document.getElementById('videoRender') !== null && document.getElementById('videoHolder') !== null) {
                    var videoRender = document.getElementById('videoRender')
                    var videoHolder = document.getElementById('videoHolder')
                    videoRender.width = videoHolder.clientWidth
                    videoRender.height = videoHolder.clientHeight
                }
            })

            // this.client.getConsoles().then((consoles) => {
            //     var consoleDiv = document.getElementById('consolesList')
            //     var consolesHtml = '';

            //     for(var device in consoles) {
            //         consolesHtml += consoles[device].deviceName+' ('+consoles[device].consoleType+') - '+consoles[device].serverId+' isSameNetwork:'+!consoles[device].outOfHomeWarning+' <button>'+consoles[device].powerState+'</button> <button onclick="client.startSession(\'xhome\', \''+consoles[device].serverId+'\')">Start session</button> <br />'
            //     }
            //     consoleDiv.innerHTML = consolesHtml

            // }).catch((error) => {
            //     console.log(error)
            // })

            this.client.addEventListener('connect', (event) => {
                // console.log('Connecting to', event.serverId)
                var streamStatus = document.getElementById('streamStatus')
                console.log(streamStatus)
                streamStatus.innerHTML = 'Connecting to '+ event.serverId
            })

            this.client.addEventListener('openstream', (event) => {
                // console.log('Stream is open...')

                // Resize UI
                document.getElementById('loadingScreen').style.display = 'none'
                // document.getElementById('actionBar').style.width = '70px'
                // document.getElementById('actionBar').style.height = '70px'
                // document.getElementById('actionBar').style.right = 'auto'
                document.getElementById('actionBar').classList.add("small")
                document.getElementById('streamingBar').style.display = 'block'

                var streamStatus = document.getElementById('streamStatus')
                streamStatus.innerHTML = 'Connected'

                // FPS Counter
                this.client.getChannelProcessor('video').addEventListener('fps', (event) => {
                    // console.log('FPS Event:', event)
                    document.getElementById('fpsCounter').innerHTML = event.fps
                })
                this.client.getChannelProcessor('audio').addEventListener('fps', (event) => {
                    // console.log('FPS Event:', event)
                    document.getElementById('audioFpsCounter').innerHTML = event.fps
                })

                // Performance debug
                this.client.getChannelProcessor('video').addEventListener('queue', (event) => {
                    document.getElementById('videoPerformance').innerHTML = JSON.stringify(event)
                })
                this.client.getChannelProcessor('audio').addEventListener('queue', (event) => {
                    document.getElementById('audioPerformance').innerHTML = JSON.stringify(event)
                })
                this.client.getChannelProcessor('input').addEventListener('queue', (event) => {
                    document.getElementById('inputPerformance').innerHTML = JSON.stringify(event)
                })

                // Load controls
                document.getElementById('currentBitrate').innerHTML = this.client.getChannelProcessor('control').getBitrate()

                this.client.getChannelProcessor('message').addEventListener('dialog', (event) => {
                    console.log('Got dialog event:', event)

                    document.getElementById('modalDialog').style.display = 'block'

                    document.getElementById('dialogTitle').innerHTML = event.TitleText
                    document.getElementById('dialogText').innerHTML = event.ContentText

                    if(event.CommandLabel1 !== '')
                        document.getElementById('dialogButton1').innerHTML = event.CommandLabel1
                    else 
                        document.getElementById('dialogButton1').style.display = 'none'
                    
                    if(event.CommandLabel2 !== '')
                        document.getElementById('dialogButton2').innerHTML = event.CommandLabel2
                    else 
                        document.getElementById('dialogButton2').style.display = 'none'

                    if(event.CommandLabel3 !== '')
                        document.getElementById('dialogButton3').innerHTML = event.CommandLabel3
                    else 
                        document.getElementById('dialogButton3').style.display = 'none'

                    // if(event.CancelIndex != event.DefaultIndex){
                        var primaryIndex = (event.DefaultIndex+1)
                        console.log('prim index', primaryIndex)
                        document.getElementById('dialogButton'+primaryIndex).classList.add("btn-primary")
                    // }

                    // var cancelIndex = (event.CancelIndex+1)
                    // document.getElementById('dialogButton'+cancelIndex).classList.add("btn-cancel")

                    document.getElementById('dialogButton1').onclick = (clickEvent) =>{
                        this.client.getChannelProcessor('message').sendTransaction(event.id, { Result: 0 })
                        this.client.resetDialog()
                    }
                    document.getElementById('dialogButton2').onclick = (clickEvent) => {
                        this.client.getChannelProcessor('message').sendTransaction(event.id, { Result: 1 })
                        this.client.resetDialog()
                    }
                    document.getElementById('dialogButton3').onclick = (clickEvent) => {
                        this.client.getChannelProcessor('message').sendTransaction(event.id, { Result: 2 })
                        this.client.resetDialog()
                    }
                })

            })

            this.client.setBitrate = function(bitrate){
                document.getElementById('currentBitrate').innerHTML = bitrate
                return this.getChannelProcessor('control').setBitrate(bitrate)
            }

            this.client.resetDialog = function(){
                document.getElementById('modalDialog').style.display = 'none'

                document.getElementById('dialogTitle').innerHTML = 'No active dialog'
                document.getElementById('dialogText').innerHTML = 'There is no active dialog. This is an error. Please try gain.'
                document.getElementById('dialogButton1').innerHTML = 'Button1'
                document.getElementById('dialogButton2').innerHTML = 'Button2'
                document.getElementById('dialogButton3').innerHTML = 'Button3'

                document.getElementById('dialogButton1').style.display = 'inline-block'
                document.getElementById('dialogButton2').style.display = 'inline-block'
                document.getElementById('dialogButton3').style.display = 'inline-block'

                document.getElementById('dialogButton1').classList.remove("btn-primary")
                document.getElementById('dialogButton2').classList.remove("btn-primary")
                document.getElementById('dialogButton3').classList.remove("btn-primary")
                document.getElementById('dialogButton1').classList.remove("btn-cancel")
                document.getElementById('dialogButton2').classList.remove("btn-cancel")
                document.getElementById('dialogButton3').classList.remove("btn-cancel")

                document.getElementById('dialogButton1').onclick = function(){}
                document.getElementById('dialogButton2').onclick = function(){}
                document.getElementById('dialogButton3').onclick = function(){}
            }
        },

        switchView: function(name) {
            for(var view in this.views){
                if(name === this.views[view]){
                    console.log('show view:', this.views[view])
                    document.getElementById(this.views[view]).style.display = 'block';
                } else {
                    console.log('hide view:', this.views[view])
                    document.getElementById(this.views[view]).style.display = 'none';
                }
            }
        },

        openConsoleView: function() {
            console.log('openConsoleView')

            this.switchView('consolesListView')

            this.client.getConsoles().then((consoles) => {
                var consoleDiv = document.getElementById('consolesList')
                var consolesHtml = '';

                for(var device in consoles) {
                    var powerState = consoles[device].powerState

                    if(powerState === 'On')
                        powerState = 'Powered on'
                    
                    if(powerState === 'ConnectedStandby')
                        powerState = 'Standby (Connected)'

                    consolesHtml += '<div class="consoleItem">'
                    consolesHtml += '   <h1>'+consoles[device].deviceName+'</h1>'
                    consolesHtml += '   <img src="data:image/png;base64,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" width="50%" /><br />'
                    consolesHtml += '   <h2>('+consoles[device].consoleType+': '+consoles[device].serverId+')</h2>'
                    consolesHtml += '   <p>'+powerState+'</p>'

                    consolesHtml += '   <button class="btn btn-primary" onclick="app.openStreamingView(\'xhome\',\''+consoles[device].serverId+'\')">Connect</p>'
                    
                    // consolesHtml += consoles[device].deviceName+' ('+consoles[device].consoleType+') - '+consoles[device].serverId+' isSameNetwork:'+!consoles[device].outOfHomeWarning+' <button>'+consoles[device].powerState+'</button> <button onclick="client.startSession(\'xhome\', \''+consoles[device].serverId+'\')">Start session</button>'
                    consolesHtml += '</div>'
                }
                consoleDiv.innerHTML = consolesHtml

            }).catch((error) => {
                console.log(error)
            })
        },

        openStreamingView: function(type, serverId) {
            console.log('openStreamingView with:', serverId)

            document.getElementById('loadingScreen').style.display = 'block'
            document.getElementById('streamingBar').style.display = 'none'
            this.client.startSession(type, serverId)

            this.switchView('streamingView')
        },

        openControls: function() {
            console.log('openControls')
        },

        openSettingsMenu: function() {
            console.log('openSettingsMenu')
        },

        openDebugStats: function() {
            if(this.isDebugMenuOpen){
                // close
                document.getElementById('debugRightTop').style.display = 'none'
                document.getElementById('debugRightBottom').style.display = 'none'
                document.getElementById('debugLeftBottom').style.display = 'none'

                this.isDebugMenuOpen = false
            } else {
                // open
                document.getElementById('debugRightTop').style.display = 'block'
                document.getElementById('debugRightBottom').style.display = 'block'
                document.getElementById('debugLeftBottom').style.display = 'block'

                this.isDebugMenuOpen = true
            }
        }
    }

    // Open the console view as default
    app.init()
})