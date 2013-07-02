/**
 * @license Copyright (c) 2012-2013 by Jeremy "Colgate" Richardson and Thomas "TAT" Andresen
 * 
 * Permission to use and/or distribute this software or parts of it for any purpose without
 * fee is hereby granted, provided that the above copyright notice and this permission notice
 * appear in all copies.
 *
 * Permission to copy and/or edit this software or parts of it for any purpose is NOT permitted
 * without written permission by the authors.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHORS DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE
 * INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHORS
 * BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER
 * RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
 * OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 * 
 * @author  Jeremy "Colgate" Richardson
 * @author  Thomas "TAT" Andresen
 */
if (typeof plugCubed !== 'undefined') plugCubed.close();
if (typeof _avatarTick === 'undefined') _avatarTick = avatarTick;
String.prototype.equalsIgnoreCase     = function(other)    { return typeof other !== 'string' ? false : this.toLowerCase() === other.toLowerCase(); };
String.prototype.startsWith           = function(other)    { return typeof other !== 'string' || other.length > this.length ? false : this.indexOf(other) === 0; };
String.prototype.endsWith             = function(other)    { return typeof other !== 'string' || other.length > this.length ? false : this.indexOf(other) === this.length-other.length; };
String.prototype.startsWithIgnoreCase = function(other)    { return typeof other !== 'string' || other.length > this.length ? false : this.toLowerCase().startsWith(other.toLowerCase()); };
String.prototype.endsWithIgnoreCase   = function(other)    { return typeof other !== 'string' || other.length > this.length ? false : this.toLowerCase().endsWith(other.toLowerCase()); };
String.prototype.isNumber             = function()         { return !isNaN(parseInt(this,10)) && isFinite(this); };
String.prototype.isHEX                = function()         { return /(^#[0-9A-F]{6}$)|(^#[0-9A-F]{3}$)/i.test(this.substr(0,1) === '#' ? this : '#' + this); };
Math.randomRange                      = function(min, max) { return min + Math.floor(Math.random()*(max-min+1)); };
Emoji._emojify = Emoji.emojify;
console.info = function(data) {
    console.log(data);
    if (_PCL !== undefined) {
        log('<span style="color:#FF0000">' + plugCubed.i18n('disconnected',[plugCubed.getTimestamp()]) + ' ' + plugCubed.i18n('reloading') + '</span>');
        setTimeout(function() { location.reload(true); },3E3);
    } else {
        if (!disconnected) {
            disconnected = true;
            log('<span style="color:#FF0000">' + plugCubed.i18n('disconnected',[plugCubed.getTimestamp()]) + '</span>');
        }
    }

};
var _PCL,
disconnected = false,
plugCubedModel = Class.extend({
    guiButtons: {},
    detectPdP: function() {
        return typeof(pdpSocket) !== 'undefined' && pdpSocket._base_url === 'http://socket.plugpony.net:9000/gateway';
    },
    version: {
        major: 1,
        minor: 7,
        patch: 0,
        prerelease: 'alpha.1',
        /**
         * @this {plugCubedModel.version}
         */
        toString: function() {
            return this.version.major + '.' + this.version.minor + '.' + this.version.patch + (this.version.prerelease !== undefined ? '-' + this.version.prerelease : '');
        }
    },
    /**
     * @this {plugCubedModel}
     */
    init: function() {
        this.proxy = {
            menu:                 $.proxy(this.onMenuClick,     this),
            onDjAdvance:          $.proxy(this.onDjAdvance,     this),
            onVoteUpdate:         $.proxy(this.onVoteUpdate,    this),
            onCurate:             $.proxy(this.onCurate,        this),
            onUserJoin:           $.proxy(this.onUserJoin,      this),
            onUserLeave:          $.proxy(this.onUserLeave,     this),
            onChat:               $.proxy(this.onChat,          this),
            onUserlistUpdate:     $.proxy(this.onUserlistUpdate,this),
            onSkip:               $.proxy(this.onSkip,          this)
        };
        //Load language and third-party scripts
        if (localStorage.plugCubedLang === undefined) return;
        $.getScript('https://rawgithub.com/TATDK/plugCubed/1.7.0/langs/lang.' + localStorage.plugCubedLang + '.js',$.proxy(this.__init,this));
        if (typeof jQuery.fn.tabs === 'undefined') {
            $.getScript('http://code.jquery.com/ui/1.10.2/jquery-ui.js');
            $('head').append('<link rel="stylesheet" href="http://code.jquery.com/ui/1.10.2/themes/smoothness/jquery-ui.css" />');
        }
    },
    /**
     * @this {plugCubedModel}
     */
    i18n: function(key,replace) {
        var a = this.lang,i;
        key = key.split('.');
        for (i in key) {
            if (a[key[i]] === undefined) return '{' + key.join('.') + '}';
            a = a[key[i]];
        }
        if (replace) {
            for (i in replace)
                a = a.split('%'+(~~i+1)).join(replace[i]);
        }
        return a;
    },
    /**
     * @this {plugCubedModel}
     */
    __init: function() {
        this.minified = false;
        this.colors = {
            userCommands: '66FFFF',
            modCommands:  'FF0000',
            infoMessage1: 'FFFF00',
            infoMessage2: '66FFFF'
        };
        this.defaultAwayMsg = this.i18n('AFK');

        setTimeout(function() {
            plugCubed.history = [];
            plugCubed.getHistory();
        },1);

        this.customColorsStyle = $('<style type="text/css"></css>');
        $('head').append(this.customColorsStyle);

        this.log(this.i18n('running',[this.version.toString()]), null, this.colors.infoMessage1);
        this.log(this.i18n('commandsHelp'), null, this.colors.infoMessage2);

        /**
         * @this {Dialog}
         */
        Dialog.showPlugCubedCommands = function(user,mod) {
            this.closeDialog();
            var width = 620,content = user;
            if (mod !== undefined)
                content = '<div id="plugCubedCommands"><ul><li><a href="#user">' + plugCubed.i18n('userCommands') + '</a></li><li><a href="#mod">' + plugCubed.i18n('modCommands') + '</a></li></ul><div id="user">' + user + '</div><div id="mod">' + mod + '</div></div>';
            this.showDialog($('<div/>').attr('id','dialog-alert').addClass('dialog').css('left',Main.LEFT+(Main.WIDTH-width-15)/2).css('top',200)
            .width(width+25).height(470).append(this.getHeader(plugCubed.i18n('commandsTitle'))).append($('<div/>').addClass('dialog-body')
            .append(this.getMessage(content).width(width))));
            $('#plugCubedCommands').tabs();
        };

        /**
         * @this {Lobby}
         */
        Lobby.onRoomSelectResponse = function(a) {
            this.spin(false);
            this.pendingLoad = false;
            var b = this.data.length;
            this.lastCursor = a.cursor;
            if (0 == a.results.length) this.endOfList = true;
            else if ((this.data = this.data.concat(a.results)) && 0 < this.data.length) {
                this.roomList || (this.roomList = $("<ul/>").addClass("room-list"));
                for (var a = this.data.length, c = b; c < a; ++c) {
                    var d = this.data[c],
                        e = $("<div/>").addClass("room-population").append($("<span/>").addClass("room-population-value").text(d.userCount)).append($("<span/>").addClass("room-population-label").html(Lang.lobby.population)),
                        f = $("<div/>").addClass("meta").append($("<span/>").addClass("room-name").text(d.name)).append($("<span/>").addClass("room-hosted-by").text(Lang.lobby.hostedBy)).append($("<span/>").addClass("room-host-name").text(d.host));
                    d.media && f.append($("<span/>").addClass("room-now-playing").text(Lang.lobby.nowPlaying)).append($("<span/>").addClass("room-media").text(d.media));
                    var g = $("<div/>").addClass("room-djs");
                    if (5 > d.djCount) {
                        var h;
                        h = 4 == d.djCount ? Lang.lobby.slotAvailable : Lang.lobby.slotsAvailable.split("%COUNT%").join("" + (5 - d.djCount));
                        g.append($("<span/>").addClass("room-djs-label").text(h))
                    } else g.append($("<span/>").addClass("room-djs-label").text(Lang.lobby.noSlots));
                    f.append(g);
                    d.friends && 0 < d.friends.length && d.userCount &&
                        (g = 1 == d.friends.length ? Lang.lobby.friendInHere : Lang.lobby.friendsInHere.split("%COUNT%").join("" + d.friends.length), f.append($("<div/>").addClass("room-friends").append($("<span/>").addClass("room-friends-label").text(g)).attr("title", d.friends.join(", "))));
                    d = $("<li/>").addClass("room-list-item").data("index", c).data("room", d).mouseenter($.proxy(this.onRoomOver, this)).mouseleave($.proxy(this.onRoomOut, this)).click($.proxy(this.onRoomClick, this)).append(e).append(f);
                    1 == c % 2 ? d.addClass("alternate-cell") :
                        d.removeClass("alternate-cell");
                    this.roomList.append(d)
                }
                0 == b && this.lobbyPanelList.append(this.roomList);
                this.posLobbyLabels()
            } else Dialog.alert(Lang.alerts.roomNotFound)
        };

        if (Models.chat._chatCommand === undefined)
            Models.chat._chatCommand = Models.chat.chatCommand;
        if (ChatModel._chatCommand   === undefined)
            ChatModel._chatCommand   = ChatModel.chatCommand;

        Models.chat.chatCommand = this.customChatCommand;
        ChatModel.chatCommand   = this.customChatCommand;
        
        this.loadSettings();
        $('body').prepend('<link rel="stylesheet" type="text/css" id="plugcubed-css" href="https://rawgithub.com/TATDK/plugCubed/1.7.0/plugCubed.css" />');
        $('body').append(
            '<div id="side-left" class="sidebar"><div class="sidebar-content"></div></div>' +
            '<div id="side-right" class="sidebar"><div class="sidebar-handle"><span>||</span></div><div class="sidebar-content"></div></div>'
        ).append('<script type="text/javascript" src="https://rawgithub.com/TATDK/plugCubed/1.7.0/thirdparty.js"></script>');
        this.initGUI();
        this.initAPIListeners();
        if (this.settings.userlist) {
            this.populateUserlist();
            this.showUserlist();
        } else this.hideUserlist();
        var users = API.getUsers();
        for (var i in users) {
            var a = users[i];
            if (a.wootcount === undefined) a.wootcount = 0;
            if (a.mehcount  === undefined) a.mehcount  = 0;
            if (a.curVote   === undefined) a.curVote   = 0;
            if (a.joinTime  === undefined) a.joinTime  = this.getTimestamp();
        }

        SocketListener.chat = function(a) {
            if (typeof plugCubed !== 'undefined' && a.fromID && plugCubed.settings.ignore.indexOf(a.fromID) > -1)
                return plugCubed.chatDisable(a);
            Models.chat.receive(a);
            API.delayDispatch(API.CHAT,a);
        };
        if (!EXT) EXT = {};
        if (!EXT.onRoomJoined) EXT.onRoomJoined = function() {
            if (typeof plugCubed !== 'undefined') {
                plugCubed.close();
                plugCubed = new plugCubedModel();
            }
        };
        else {
            if (!EXT._onRoomJoined) EXT._onRoomJoined = EXT.onRoomJoined;
            EXT.onRoomJoined = function() {
                if (typeof plugCubed !== 'undefined') {
                    plugCubed.close();
                    plugCubed = new plugCubedModel();
                }
                EXT._onRoomJoined();
            };
        }
        this.Socket();
    },
    /**
     * @this {plugCubedModel}
     */
    close: function() {
        Models.chat.chatCommand = Models.chat._chatCommand;
        ChatModel.chatCommand = ChatModel._chatCommand;
        API.removeEventListener(API.DJ_ADVANCE,       this.proxy.onDjAdvance);
        API.removeEventListener(API.VOTE_UPDATE,      this.proxy.onVoteUpdate);
        API.removeEventListener(API.CURATE_UPDATE,    this.proxy.onCurate);
        API.removeEventListener(API.USER_JOIN,        this.proxy.onUserJoin);
        API.removeEventListener(API.USER_LEAVE,       this.proxy.onUserLeave);
        API.removeEventListener(API.CHAT,             this.proxy.onChat);
        API.removeEventListener(API.VOTE_SKIP,        this.proxy.onSkip);
        API.removeEventListener(API.USER_SKIP,        this.proxy.onSkip);
        API.removeEventListener(API.MOD_SKIP,         this.proxy.onSkip);
        API.removeEventListener(API.WAIT_LIST_UPDATE, this.proxy.onUserlistUpdate);
        API.removeEventListener('userUpdate',         this.proxy.onUserlistUpdate);
        for (var i in plugCubed.guiButtons) {
            if (i === undefined || plugCubed.guiButtons[i] === undefined) continue;
            $('#plugcubed-btn-' + i).unbind();
            delete plugCubed.guiButtons[i];
        }
        $('#plugcubed-css').remove();
        $('#plugcubed-js-extra').remove();
        $('#side-right').remove();
        $('#side-left').remove();
        this.customColorsStyle.remove();
        this.socket.onclose = function() {};
        this.socket.close();
        delete plugCubed;
    },
    /**
     * @this {plugCubedModel}
     */
    Socket: function() {
        this.socket = new SockJS('http://socket.plugpony.net:923/gateway');
        this.socket.tries = 0;
        /**
         * @this {SockJS}
         */
        this.socket.onopen = function() {
            this.tries = 0;
            this.send(JSON.stringify({
                id:       Models.user.data.id,
                username: Models.user.data.username,
                room:     Models.room.data.id,
                version:  plugCubed.version.major + '.' + plugCubed.version.minor + '.' + plugCubed.version.patch
            }));
        }
        /**
         * @this {SockJS}
         */
        this.socket.onmessage = function(msg) {
            var data = JSON.parse(msg.data);
            if (data.type === 'update') {
                plugCubed.socket.onclose = function() {};
                plugCubed.socket.close();
                plugCubed.log(plugCubed.i18n('newVersion'), null, plugCubed.colors.infoMessage1);
                setTimeout(function() { $.getScript('https://rawgithub.com/TATDK/plugCubed/1.7.0/plugCubed.' + (plugCubed.minified ? 'min.' : '') + 'js'); },5000);
            }
        }
        /**
         * @this {SockJS}
         */
        this.socket.onclose = function() {
            this.tries++;

            var delay;
            if (this.tries < 5)       delay = 5;
            else if (this.tries < 30) delay = 30;
            else if (this.tries < 60) delay = 60;
            else                      return;

            setTimeout(function() { plugCubed.Socket(); },delay*1E3);
        }
    },
    /**
     * @this {plugCubedModel}
     */
    showUserlist: function() {
        $('#side-left').show().animate({ 'left': '0px' }, 300, typeof jQuery.easing.easeOutQuart === 'undefined' ? undefined : 'easeOutQuart');
        if (this.detectPdP()) {
            if (userlistShow === true) $('#pdpUsers').hide();
            $('#pdpUsersToggle').hide();
        }
    },
    /**
     * @this {plugCubedModel}
     */
    hideUserlist: function() {
        var sbarWidth = -$('#side-left').width()-20;
        $('#side-left').animate({ 'left': sbarWidth + 'px' }, 300, typeof jQuery.easing.easeOutQuart === 'undefined' ? undefined : 'easeOutQuart', function() {
            $('#side-left').hide();
        });
        if (this.detectPdP()) {
            if (userlistShow === true) $('#pdpUsers').show();
            $('#pdpUsersToggle').show();
        }
    },
    colorInfo: {
        you        : { title: 'ranks.you',          color: 'FFDD6F' },
        regular    : { title: 'ranks.regular',      color: 'B0B0B0' },
        featureddj : { title: 'ranks.featureddj',   color: 'E90E82' },
        bouncer    : { title: 'ranks.bouncer',      color: 'E90E82' },
        manager    : { title: 'ranks.manager',      color: 'E90E82' },
        cohost     : { title: 'ranks.cohost',       color: 'E90E82' },
        host       : { title: 'ranks.host',         color: 'E90E82' },
        ambassador : { title: 'ranks.ambassador',   color: '9A50FF' },
        admin      : { title: 'ranks.admin',        color: '42A5DC' },
        join       : { title: 'notify.join',        color: '3366FF' },
        leave      : { title: 'notify.leave',       color: '3366FF' },
        curate     : { title: 'notify.curate',      color: '00FF00' },
        stats      : { title: 'notify.stats',       color: '66FFFF' },
        updates    : { title: 'notify.updates',     color: 'FFFF00' }
    },
    settings: {
        recent           : false,
        awaymsg          : '',
        autowoot         : false,
        autojoin         : false,
        userlist         : false,
        autorespond      : false,
        menu             : false,
        notify           : false,
        customColors     : false,
        emoji            : true,
        avatarAnimations : true,
        registeredSongs  : [],
        ignore           : [],
        alertson         : [],
        autoMuted        : false,
        chatlimit        : {
            enabled         : false,
            limit           : 50
        },
        colors           : {
            you             : 'FFDD6F',
            regular         : 'B0B0B0',
            featureddj      : 'E90E82',
            bouncer         : 'E90E82',
            manager         : 'E90E82',
            cohost          : 'E90E82',
            host            : 'E90E82',
            ambassador      : '9A50FF',
            admin           : '42A5DC',
            join            : '3366FF',
            leave           : '3366FF',
            curate          : '00FF00',
            stats           : '66FFFF',
            updates         : 'FFFF00'
        },
        alerts           : {
            join            : false,
            leave           : false,
            curate          : false,
            songUpdate      : false,
            songStats       : false
        }
    },
    /**
     * @this {plugCubedModel}
     */
    loadSettings: function() {
        if (localStorage.plugCubed === undefined) return;
        var save = JSON.parse(localStorage.plugCubed);
        for (var i in this.settings) {
            if (save[i] !== undefined) this.settings[i] = save[i];
        }
        this.settings.recent = false;
        if (this.settings.autowoot) this.woot();
        if (this.settings.userlist) {
            this.populateUserlist();
            this.showUserlist();
        };
        if (this.settings.customColors)
            this.updateCustomColors();
        if (this.settings.registeredSongs.length > 0 && this.settings.registeredSongs.indexOf(Models.room.data.media.id) > -1) {
            Playback.setVolume(0);
            this.settings.autoMuted = true;
            this.log(this.i18n('automuted',[Models.room.data.media.title]), null, this.colors.infoMessage2);
        };
        if (!this.settings.emoji) {
            if (Emoji._emojify === undefined) Emoji._emojify = Emoji.emojify
            Emoji.emojify = function(data) {return data;}
        }
        if (!this.settings.avatarAnimations)
            avatarTick = function() {};
    },
    /**
     * @this {plugCubedModel}
     */
    saveSettings: function() {
        localStorage.plugCubed = JSON.stringify(this.settings);
    },
    /**
     * @this {plugCubedModel}
     */
    updateCustomColors: function() {
        if (this.settings.customColors)
            this.customColorsStyle.text(
                [
                    '.chat-message .chat-from,',
                    '.chat-mention .chat-from { color:#' + this.settings.colors.regular + '!important; }',
                    '.chat-message .chat-from-featureddj,',
                    '.chat-mention .chat-from-featureddj { color:#' + this.settings.colors.featureddj + '!important; }',
                    '.chat-message .chat-from-bouncer,',
                    '.chat-mention .chat-from-bouncer { color:#' + this.settings.colors.bouncer + '!important; }',
                    '.chat-message .chat-from-manager,',
                    '.chat-mention .chat-from-manager { color:#' + this.settings.colors.manager + '!important; }',
                    '.chat-message .chat-from-cohost,',
                    '.chat-mention .chat-from-cohost { color:#' + this.settings.colors.cohost + '!important; }',
                    '.chat-message .chat-from-host,',
                    '.chat-mention .chat-from-host { color:#' + this.settings.colors.host + '!important; }',
                    '.chat-message .chat-from-ambassador,',
                    '.chat-mention .chat-from-ambassador { color:#' + this.settings.colors.ambassador + '!important; }',
                    '.chat-message .chat-from-admin,',
                    '.chat-mention .chat-from-admin { color:#' + this.settings.colors.admin + '!important; }',
                    '.chat-message .chat-from-you,',
                    '.chat-mention .chat-from-you { color:#' + this.settings.colors.you + '!important; }'
                ].join("\n")
            );
        else
            this.customColorsStyle.text('');
    },
    /**
     * @this {plugCubedModel}
     */
    initAPIListeners: function() {
        API.addEventListener(API.DJ_ADVANCE,       this.proxy.onDjAdvance);
        API.addEventListener(API.VOTE_UPDATE,      this.proxy.onVoteUpdate);
        API.addEventListener(API.CURATE_UPDATE,    this.proxy.onCurate);
        API.addEventListener(API.USER_JOIN,        this.proxy.onUserJoin);
        API.addEventListener(API.USER_LEAVE,       this.proxy.onUserLeave);
        API.addEventListener(API.CHAT,             this.proxy.onChat);
        API.addEventListener(API.VOTE_SKIP,        this.proxy.onSkip);
        API.addEventListener(API.USER_SKIP,        this.proxy.onSkip);
        API.addEventListener(API.MOD_SKIP,         this.proxy.onSkip);
        API.addEventListener(API.WAIT_LIST_UPDATE, this.proxy.onUserlistUpdate);
        API.addEventListener('userUpdate',         this.proxy.onUserlistUpdate);
    },
    /**
     * @this {plugCubedModel}
     */
    initGUI: function() {
        $('#side-right .sidebar-content').html('');
        this.addGUIButton(this.settings.autowoot,          'woot',        this.i18n('menu.autowoot'));
        this.addGUIButton(this.settings.autojoin,          'join',        this.i18n('menu.autojoin'));
        this.addGUIButton(this.settings.userlist,          'userlist',    this.i18n('menu.userlist'));
        this.addGUIButton(this.settings.customColors,      'colors',      this.i18n('menu.customchatcolors'));
        this.addGUIButton(this.settings.autorespond,       'autorespond', this.i18n('menu.afkstatus'));
        this.addGUIButton(this.settings.notify,            'notify',      this.i18n('menu.notify'));
        this.addGUIButton(this.settings.chatlimit.enabled, 'chatlimit',   this.i18n('menu.limitchatlog'));
        this.addGUIButton(!DB.settings.streamDisabled,     'stream',      this.i18n('menu.stream'));
        this.addGUIButton(this.settings.emoji,             'emoji',       this.i18n('menu.emoji'));
        this.addGUIButton(this.settings.avatarAnimations,  'avataranim',  this.i18n('menu.avatarAnimations'));
    },
    /**
     * @this {plugCubedModel}
     */
    addGUIButton: function(setting, id, text) {
        if (this.guiButtons[id] !== undefined) return;
        if ($('#side-right .sidebar-content').children().length > 0)
            $('#side-right .sidebar-content').append('<hr />');

        $('#side-right .sidebar-content').append('<a id="plugcubed-btn-' + id + '"><div class="status-' + (setting ? 'on' : 'off') + '"></div>' + text + '</a>');
        $('#plugcubed-btn-' + id).data('key',id).click(this.proxy.menu);

        this.guiButtons[id] = { text: text };
    },
    changeGUIColor: function(id,value) {
        $('#plugcubed-btn-' + id).find('[class^="status-"], [class*=" status-"]').attr('class','status-' + (value === true ? 'on' : 'off'));
    },
    /**
     * @this {plugCubedModel}
     */
    populateUserlist: function() {
        if ($('#side-left .sidebar-content').children().length > 0)
            $('#side-left .sidebar-content').append('<hr />');
        $('#side-left .sidebar-content').bind('contextmenu',function(e){return false;});
        $('#side-left .sidebar-content').html('<h1 class="users">Users: ' + API.getUsers().length + '</h1>');
        var spot = Models.room.getWaitListPosition();
        var waitlistDiv = $('<h3></h3>').addClass('waitlistspot').text('Waitlist: ' + (spot !== null ? spot + ' / ' : '') + Models.room.data.waitList.length);
        $('#side-left .sidebar-content').append(waitlistDiv).append('<hr />');
        var users = API.getUsers();
        for (var i in users)
            this.appendUser(users[i]);
    },
    /**
     * @this {plugCubedModel}
     */
    log: function(message, from, color, changeToColor) {
        var style  = '',
            div,
            scroll = false;

        if (color) style = ' style="color:' + (color.substr(0,1) === '#' ? color : '#' + color) + ';"';

        if (from) div = '<div class="chat-message"><span class="chat-from"' + style + '>' + from + '</span><span class="chat-text"' + style + '>: ' + message + '</span></div>';
        else      div = '<div class="chat-message"><span class="chat-text"' + style + '>' + message + '</span></div>';

        if ($('#chat-messages')[0].scrollHeight - $('#chat-messages').scrollTop() == $('#chat-messages').outerHeight())
            scroll = true;

        var curChatDiv = Popout ? Popout.Chat.chatMessages : Chat.chatMessages,
            s          = curChatDiv.scrollTop()>curChatDiv[0].scrollHeight-curChatDiv.height()-20;

        curChatDiv.append(div);

        if (s) curChatDiv.scrollTop(curChatDiv[0].scrollHeight);
        
        if (changeToColor) {
            $(div).click(function(e) {
                this.childNodes[0].style.color = changeToColor;
            });
        }
    },
    /**
     * @this {plugCubedModel}
     */
    appendUser: function(user) {
        var username = Utils.cleanTypedString(user.username),prefix;

             if (user.curated == true)                                                                          prefix = 'curate';
        else if (this.isPlugCubedAdmin(user.id))                                                                prefix = 'plugcubed';
        else if (this.isPlugCubedVIP(user.id))                                                                  prefix = 'vip';
        else if (Models.room.data.staff[user.id] && Models.room.data.staff[user.id] == Models.user.FEATUREDDJ)  prefix = 'fdj';
        else if (Models.room.data.staff[user.id] && Models.room.data.staff[user.id] == Models.user.BOUNCER)     prefix = 'bouncer';
        else if (Models.room.data.staff[user.id] && Models.room.data.staff[user.id] == Models.user.MANAGER)     prefix = 'manager';
        else if (Models.room.data.staff[user.id] && Models.room.data.staff[user.id] == Models.user.COHOST)      prefix = 'host';
        else if (Models.room.data.staff[user.id] && Models.room.data.staff[user.id] == 5)                       prefix = 'host';
        else if (Models.room.ambassadors[user.id])                                                              prefix = 'ambassador';
        else if (Models.room.admins[user.id])                                                                   prefix = 'admin';
        else                                                                                                    prefix = 'normal';

        if (Models.room.data.djs.length > 0 && Models.room.data.djs[0].user.id == user.id) {
            if (prefix === 'normal')
                this.appendUserItem('void', '#66FFFF', username);
            else
                this.appendUserItem(prefix + '_current', '#66FFFF', username);
        } else if (prefix === 'normal')
            this.appendUserItem('void',this.colorByVote(user.vote), username);
        else
            this.appendUserItem(prefix + this.prefixByVote(user.vote), this.colorByVote(user.vote), username);
    },
    colorByVote: function(vote) {
        var color = '';
        if (vote === undefined)
            color = 'FFFFFF';

        else {
            switch (vote) {
                case -1: color = 'ED1C24'; break;
                case 1:  color = '3FFF00'; break;
                default: color = 'FFFFFF'; break;
            }
        }
        return '#' + color;
    },
    prefixByVote: function(vote) {
        var prefix = '';
        if (vote === undefined)
            prefix = 'undecided';
        else switch (vote) {
            case -1: prefix = 'meh'; break;
            case 1:  prefix = 'woot'; break;
            default: prefix = 'undecided'; break;
        }
        return '_' + prefix;
    },
    appendUserItem: function(prefix, color, username) {
        $('#side-left .sidebar-content').append(
            $('<p></p>')
                .append(
                    $('<span></span>')
                        .append($('<span></span>').addClass(prefix))
                        .css('cursor','pointer')
                        .css('color',color)
                        .mousedown(function(event) {
                            switch(event.which) {
                                case 1:
                                    $('#chat-input-field').val($('#chat-input-field').val() + '@' + username + ' ').focus();
                                    break;
                                case 2:
                                    break;
                                case 3:
                                    if (Models.room.data.staff[Models.user.data.id] && Models.room.data.staff[Models.user.data.id] >= Models.user.BOUNCER || plugCubed.isPlugCubedAdmin(Models.user.data.id))
                                    plugCubed.getUserInfo(username);
                                    break;
                            }
                        })
                        .html(function(a,b) { return b + username; })
                )
        );
    },
    getUser: function(data) {
        data = data.trim();
        if (data.substr(0,1) === '@')
            data = data.substr(1);

        var users = API.getUsers();
        for (var i in users) {
            if (users[i].username.equalsIgnoreCase(data) || users[i].id.equalsIgnoreCase(data))
                return users[i];
        }
        return null;
    },
    /**
     * @this {plugCubedModel}
     */
    moderation: function(target, type) {
        if (Models.room.data.staff[Models.user.data.id] && Models.room.data.staff[Models.user.data.id] >= Models.user.BOUNCER) {
            var service;
            switch (type) {
                case 'kick':     service = ModerationKickUserService; break;
                case 'removedj': service = ModerationRemoveDJService; break;
                case 'adddj':    service = ModerationAddDJService;    break;
                default:         log(this.i18n('error.unknownModeration')); return;
            }
            var user = this.getUser(target);
            if (user === null) log(this.i18n('error.userNotFound'));
            else               new service(user.id,' ');
        }
    },
    /**
     * @this {plugCubedModel}
     */
    getUserInfo: function(data) {
        var user = this.getUser(data);
        if (user === null) log(this.i18n('error.userNotFound'));
        else {
            var rank,
                status,
                voted,
                position,
                points      = user.djPoints + user.curatorPoints + user.listenerPoints,
                voteTotal   = user.wootcount + user.mehcount,
                waitlistpos = Models.room.getWaitListPosition(user.id),
                boothpos    = -1;

                 if (Models.room.data.staff[user.id] && Models.room.data.staff[user.id] == Models.user.FEATUREDDJ) rank = this.i18n('ranks.featureddj');
            else if (Models.room.data.staff[user.id] && Models.room.data.staff[user.id] == Models.user.BOUNCER)    rank = this.i18n('ranks.bouncer');
            else if (Models.room.data.staff[user.id] && Models.room.data.staff[user.id] == Models.user.MANAGER)    rank = this.i18n('ranks.manager');
            else if (Models.room.data.staff[user.id] && Models.room.data.staff[user.id] == Models.user.COHOST)     rank = this.i18n('ranks.cohost');
            else if (Models.room.data.staff[user.id] && Models.room.data.staff[user.id] == 5)                      rank = this.i18n('ranks.host');
            else if (Models.room.ambassadors[user.id])                                                             rank = this.i18n('ranks.ambassador');
            else if (Models.room.admins[user.id])                                                                  rank = this.i18n('ranks.admin');
            else                                                                                                   rank = this.i18n('ranks.regular');

            if (waitlistpos === null) {
                if (Models.room.data.djs.length > 0 && Models.room.data.djs[0].user.id === user.id) {
                    position = this.i18n('info.djing');
                    boothpos = 0;
                } else {
                    for (var i = 1;i < Models.room.data.djs.length;i++)
                        boothpos = Models.room.data.djs[i].user.id === user.id ? i : boothpos;
                    if (boothpos < 0)
                        position = this.i18n('info.notinlist');
                    else
                        position = this.i18n('info.inbooth',[boothpos + 1,Models.room.data.djs.length]);
                }
            } else
                position = this.i18n('info.inwaitlist',[waitlistpos,Models.room.data.waitList.length]);

            switch (user.status) {
                case -1: status = this.i18n('status.idle');      break;
                default: status = this.i18n('status.available'); break;
                case 1:  status = this.i18n('status.afk');       break;
                case 2:  status = this.i18n('status.working');   break;
                case 3:  status = this.i18n('status.sleeping');  break;
            }

            switch (user.vote) {
                case -1:  voted = this.i18n('vote.meh');       break;
                default:  voted = this.i18n('vote.undecided'); break;
                case 1:   voted = this.i18n('vote.woot');      break;
            }
            if (boothpos === 0) voted = this.i18n('vote.djing');

            var title = undefined;
            if (this.isPlugCubedAdmin(user.id)) title = this.i18n('info.specialTitles.developer');
            if (this.isPlugCubedVIP(user.id))   title = this.i18n('info.specialTitles.vip');

            log('<table style="width:100%;color:#CC00CC"><tr><td colspan="2"><strong>' + this.i18n('info.name') + '</strong>: <span style="color:#FFFFFF">' + user.username + '</span></td></tr>' +
            (title ? '<tr><td colspan="2"><strong>' + this.i18n('info.title') + '</strong>: <span style="color:#FFFFFF">' + title + '</span></td></tr>' : '') +
            '<tr><td colspan="2"><strong>' + this.i18n('info.id') + '</strong>: <span style="color:#FFFFFF">' + user.id + '</span></td></tr>' +
            '<tr><td><strong> ' + this.i18n('info.rank') + '</strong>: <span style="color:#FFFFFF">' + rank + '</span></td><td><strong>' + this.i18n('info.joined') + '</strong>: <span style="color:#FFFFFF">' + user.joinTime + '</span></td></tr>' +
            '<tr><td><strong>' + this.i18n('info.status') + '</strong>: <span style="color:#FFFFFF">' + status + '</span></td><td><strong> ' + this.i18n('info.vote') + '</strong>: <span style="color:#FFFFFF">' + voted + '</span></td></tr>' +
            '<tr><td colspan="2"><strong>' + this.i18n('info.position') + '</strong>: <span style="color:#FFFFFF">' + position + '</span></td></tr>' +
            '<tr><td><strong>' + this.i18n('info.points') + '</strong>: <span style="color:#FFFFFF" title = "' + this.i18n('info.pointType.dj',[user.djPoints]) + '  +  ' + this.i18n('info.pointType.listener',[user.listenerPoints]) + '  +  ' + this.i18n('info.pointType.curator',[user.curatorPoints]) + '">' + points + '</span></td><td><strong> ' + this.i18n('info.fans') + '</strong>: <span style="color:#FFFFFF">' + user.fans + '</span></td></tr>' +
            '<tr><td><strong>' + this.i18n('info.wootCount') + '</strong>: <span style="color:#FFFFFF">' + user.wootcount + '</span></td><td><strong>' + this.i18n('info.mehCount') + '</strong>: <span style="color:#FFFFFF">' + user.mehcount + '</span></td></tr>' +
            '<tr><td colspan="2"><strong>' + this.i18n('info.ratio') + '</strong>: <span style="color:#FFFFFF">' + (voteTotal === 0 ? '0' : (user.wootcount/voteTotal).toFixed(2)) + '</span></td></tr></table>');
        }
    },
    /**
     * @this {plugCubedModel}
     */
    onMenuClick: function(e) {
        var a = $(e.currentTarget).data('key');
        switch (a) {
            case 'woot':
                this.settings.autowoot = !this.settings.autowoot;
                this.changeGUIColor('woot',this.settings.autowoot);
                if (this.settings.autowoot)
                    $('#button-vote-positive').click();
                break;
            case 'join':
                this.settings.autojoin = !this.settings.autojoin;
                this.changeGUIColor('join',this.settings.autojoin);
                if (this.settings.autojoin && $('#button-dj-waitlist-join').length > 0)
                    API.waitListJoin();
                break;
            case 'userlist':
                this.settings.userlist = !this.settings.userlist;
                this.changeGUIColor('userlist',this.settings.userlist);
                if (this.settings.userlist) {
                    this.populateUserlist();
                    this.showUserlist();
                } else {
                    $('#side-left .sidebar-content').empty();
                    this.hideUserlist();
                }
                break;
            case 'colors':
                Dialog.closeDialog();
                var body = $('<form/>')
                    .submit('return false')
                    .append(Dialog.getCheckBox('Enable custom', 'enabled', this.settings.customColors)),j = 0;
                for (var i in this.colorInfo)
                    body.append($(Dialog.getInputField(i,this.i18n(this.colorInfo[i].title),this.colorInfo[i].color,this.settings.colors[i],6).css('top',++j*30)).change(function() { $(this).find('.dialog-input-label').css('color','#' + $(this).find('input').val()); }));
                body = $('<div/>')
                    .addClass('dialog-body')
                    .append(body);
                for (var i in this.settings.colors)
                    body.find('input[name="' + i + '"]').parents('.dialog-input-container').find('.dialog-input-label').css('color','#' + this.settings.colors[i]);
                Dialog.context = 'isCustomChatColors';
                Dialog.submitFunc = $.proxy(this.onColorSubmit, this);
                return Dialog.showDialog(
                    $('<div/>')
                    .attr('id', 'dialog-custom-colors')
                    .addClass('dialog')
                    .css('left',Main.LEFT+(Main.WIDTH-230)/2)
                    .css('top',208.5)
                    .append(Dialog.getHeader('Custom Chat Colors'))
                    .append(body)
                    .append($('<div/>').addClass('dialog-button dialog-default-button').click($.proxy(this.onColorDefault,this)).append($('<span/>').text('Default')))
                    .append(Dialog.getCancelButton())
                    .append(Dialog.getSubmitButton(Lang.dialog.save))
                );
                break;
            case 'autorespond':
                this.settings.autorespond = !this.settings.autorespond;
                this.changeGUIColor('autorespond',this.settings.autorespond);
                if (this.settings.autorespond) {
                    var a = prompt('Please enter your away message here.\nThis is what you will reply via @mention.',this.settings.awaymsg === '' ? this.defaultAwayMsg : this.settings.awaymsg);
                    if (a === null) {
                        this.settings.autorespond = false;
                        this.changeGUIColor('autorespond',false);
                        return;
                    }
                    a = a.split('@').join('').trim();
                    this.settings.awaymsg = a === '' ? this.defaultAwayMsg : a;
                    if (Models.user.data.status <= 0)
                        Models.user.changeStatus(1);
                } else Models.user.changeStatus(0);
                break;
            case 'notify':
                Dialog.closeDialog();
                Dialog.context = 'isNotifySettings';
                Dialog.submitFunc = $.proxy(this.onNotifySubmit, this);
                return Dialog.showDialog(
                    $('<div/>')
                    .attr('id','dialog-notify')
                    .addClass('dialog')
                    .css('left',Main.LEFT+(Main.WIDTH-230)/2)
                    .css('top',208.5)
                    .append(Dialog.getHeader(this.i18n('notify.header')))
                    .append(
                        $('<div/>')
                        .addClass('dialog-body')
                        .append(
                            $('<form/>')
                            .submit('return false')
                            .append(Dialog.getCheckBox(this.i18n('enable'),         'enabled',    this.settings.notify            ).css('top',10) .css('left',10))
                            .append(Dialog.getCheckBox(this.i18n('notify.join'),    'join',       this.settings.alerts.join       ).css('top',30) .css('left',30))
                            .append(Dialog.getCheckBox(this.i18n('notify.leave'),   'leave',      this.settings.alerts.leave      ).css('top',50) .css('left',30))
                            .append(Dialog.getCheckBox(this.i18n('notify.curate'),  'curate',     this.settings.alerts.curate     ).css('top',70) .css('left',30))
                            .append(Dialog.getCheckBox(this.i18n('notify.stats'),   'songStats',  this.settings.alerts.songStats  ).css('top',90) .css('left',30))
                            .append(Dialog.getCheckBox(this.i18n('notify.updates'), 'songUpdate', this.settings.alerts.songUpdate ).css('top',110).css('left',30))
                        )
                    )
                    .append(Dialog.getCancelButton())
                    .append(Dialog.getSubmitButton(Lang.dialog.save))
                );
                break;
            case 'chatlimit':
                Dialog.closeDialog();
                Dialog.context = 'isChatLimitSettings';
                Dialog.submitFunc = $.proxy(this.onChatLimitSubmit, this);
                return Dialog.showDialog(
                    $('<div/>')
                    .attr('id','dialog-chat-limit')
                    .addClass('dialog')
                    .css('left',Main.LEFT+(Main.WIDTH-230)/2)
                    .css('top',208.5)
                    .append(Dialog.getHeader(this.i18n('chatLimit.header')))
                    .append(
                        $('<div/>')
                        .addClass('dialog-body')
                        .append(
                            $('<form/>')
                            .submit('return false')
                            .append(Dialog.getCheckBox(this.i18n('enable'),'enabled',this.settings.chatlimit.enabled).css('top',10) .css('left',10))
                            .append(Dialog.getInputField(this.i18n('chatLimit.limit'),'Limit',0,this.settings.chatlimit.limit).css('top',30) .css('left',10))
                        )
                    )
                    .append(Dialog.getCancelButton())
                    .append(Dialog.getSubmitButton(Lang.dialog.save))
                );
                break;
            case 'stream':
                this.changeGUIColor('stream',DB.settings.streamDisabled);
                return API.sendChat(DB.settings.streamDisabled ? '/stream on' : '/stream off');
                break;
            case 'emoji':
                this.settings.emoji = !this.settings.emoji;
                this.changeGUIColor('emoji',this.settings.emoji);
                if (!this.settings.emoji) {
                    if (Emoji._emojify === undefined) Emoji._emojify = Emoji.emojify
                    Emoji.emojify = function(data) {return data;}
                } else {
                    if (Emoji._emojify === undefined) return this.log(this.i18n('error.emoji'), null, this.colors.modCommands);
                    Emoji.emojify = Emoji._emojify
                }
                break;
            case 'avataranim':
                this.settings.avatarAnimations = !this.settings.avatarAnimations;
                plugCubed.changeGUIColor('avataranim',plugCubed.settings.avatarAnimations);
                avatarTick = this.settings.avatarAnimations ? _avatarTick : function() {},avatarTick(0);
                break;
            default: return log(this.i18n('menu.unknown'));
        }
        this.saveSettings();
    },
    /**
     * @this {plugCubedModel}
     */
    onNotifySubmit: function() {
        this.settings.notify = $('#dialog-checkbox-enabled').is(':checked');
        for (var i in this.settings.alerts)
            this.settings.alerts[i] = $('#dialog-checkbox-' + i).is(':checked');
        this.changeGUIColor('notify',this.settings.notify);
        this.saveSettings();
        Dialog.closeDialog();
    },
    /**
     * @this {plugCubedModel}
     */
    onChatLimitSubmit: function() {
        this.settings.chatlimit.enabled = $('#dialog-checkbox-enabled').is(':checked');
        this.settings.chatlimit.limit = ~~$('input[name="chat-limit"]').val();
        this.changeGUIColor('chatlimit',this.settings.chatlimit.enabled);
        if (this.settings.chatlimit.enabled) {
            var elems = $('#chat-messages').children('div'),num = elems.length,i = 0;
            elems.each(function() {
                if (++i<num-plugCubed.settings.chatlimit.limit)
                    $(this).remove();
            });
        }
        this.saveSettings();
        Dialog.closeDialog();
    },
    /**
     * @this {plugCubedModel}
     */
    onColorDefault: function() {
        for (var i in this.settings.colors) {
            var elem = $('input[name="' + i + '"]');
            elem.val(elem.data('ph'));
            elem.parents('.dialog-input-container').find('.dialog-input-label').css('color','#' + elem.val());
        }
    },
    /**
     * @this {plugCubedModel}
     */
    onColorSubmit: function() {
        this.settings.customColors = $('#dialog-checkbox-enabled').is(':checked');
        for (var i in this.settings.colors) {
            var elem = $('input[name="' + i + '"]');
            this.settings.colors[i] = elem.val() === '' || !elem.val().isHEX() ? elem.data('ph') : elem.val();
        }
        this.updateCustomColors();
        this.changeGUIColor('colors',this.settings.customColors);
        this.saveSettings();
        Dialog.closeDialog();
    },
    /**
     * @this {plugCubedModel}
     */
    onVoteUpdate: function(data) {
        if (!data || !data.user) return;
        var a = Models.room.userHash[data.user.id];
        this.onUserlistUpdate();

        if (a.curVote === 1)       a.wootcount--;
        else if (a.curVote === -1) a.mehcount--;

        if (data.vote === 1)       a.wootcount++;
        else if (data.vote === -1) a.mehcount++;

        a.curVote = data.vote;
    },
    /**
     * @this {plugCubedModel}
     */
    onCurate: function(data) {
        var media = API.getMedia();
        if (this.settings.notify === true && this.settings.alerts.curate === true)
            this.log(this.i18n('notify.message.curate',[data.user.username,media.author,media.title]), null, this.settings.colors.curate);
        Models.room.userHash[data.user.id].curated = true;
        this.onUserlistUpdate();
    },
    /**
     * @this {plugCubedModel}
     */
    onDjAdvance: function(data) {
        if (this.settings.notify === true) {
            if (this.settings.alerts.songStats === true) this.log(this.i18n('nofity.message.stats',[data.lastPlay.score.positive,data.lastPlay.score.negative,data.lastPlay.score.curates]), null, this.settings.colors.stats)
            if (this.settings.alerts.songUpdate === true) this.log(this.i18n('notify.message.updates',[data.media.title,data.media.author,data.dj.username]), null, this.settings.colors.updates)
        }
        setTimeout($.proxy(this.onDjAdvanceLate,this),Math.randomRange(1,10)*1000);
        if(Models.user.getPermission() >= Models.user.BOUNCER || this.isPlugCubedAdmin(Models.user.data.id)) this.onHistoryCheck(data.media.id)
        var obj = {
            id         : data.media.id,
            author     : data.media.author,
            title      : data.media.title,
            wasSkipped : false,
            user       : {
                id       : data.dj.id,
                username : data.dj.username
            }
        };
        plugCubed.history.unshift(obj);
        plugCubed.history.splice(50,plugCubed.history.length-50);
        if (this.settings.autoMuted && this.settings.registeredSongs.indexOf(data.media.id) < 0) {
            setTimeout(function(){ Playback.setVolume(Playback.lastVolume); },800);
            this.settings.autoMuted = false;
        }
        if (!this.settings.autoMuted && this.settings.registeredSongs.indexOf(data.media.id) > -1) {
            setTimeout(function() { Playback.setVolume(0); }, 800);
            this.settings.autoMuted = true;
            this.log(i18n('automuted',[data.media.title]), null, this.colors.infoMessage2);

        }
        this.onUserlistUpdate();
        var users = API.getUsers();
        for (var i in users)
            users[i].curVote = 0;
    },
    /**
     * @this {plugCubedModel}
     */
    onDjAdvanceLate: function(data) {
        if (this.settings.autowoot && this.settings.registeredSongs.indexOf(Models.room.data.media.id) < 0) this.woot();
        if ($('#button-dj-waitlist-join').css('display') === 'block' && this.settings.autojoin)
            Room.onWaitListJoinClick();
    },
    woot: function() {
        if (Models.room.data.djs === undefined || Models.room.data.djs.length === 0) return;
        var dj = Models.room.data.djs[0];
        if (dj === null || dj == API.getSelf()) return;
        $('#button-vote-positive').click();
    },
    /**
     * @this {plugCubedModel}
     */
    onUserJoin: function(data) {
        if (this.settings.notify === true && this.settings.alerts.join === true)
            this.log(Utils.cleanTypedString(data.username + ' joined the room'), null, this.settings.colors.join);
        var a = Models.room.userHash[data.id];
        if (a.wootcount === undefined) a.wootcount = 0;
        if (a.mehcount === undefined)  a.mehcount = 0;
        if (a.curVote === undefined)   a.curVote = 0;
        if (a.joinTime === undefined)  a.joinTime = this.getTimestamp();
        this.onUserlistUpdate();
    },
    /**
     * @this {plugCubedModel}
     */
    onUserLeave: function(data) {
        if (this.settings.notify === true && this.settings.alerts.leave === true)
            this.log(Utils.cleanTypedString(data.username + ' left the room'), null, this.settings.colors.leave);
        this.onUserlistUpdate();
    },
    isPlugCubedAdmin: function(id) {
        return (id == '50aeb31696fba52c3ca0adb6' || id == '50aeb077877b9217e2fbff00');
    },
    isPlugCubedVIP: function(id) {
        return (id == '5112c273d6e4a94ec0554792' || id == '50b1961c96fba57db2230417');
    },
    /**
     * @this {plugCubedModel}
     */
    chatDisable: function(data) {
        var a = data.type == 'mention' && (Models.room.data.staff[data.fromID] && Models.room.data.staff[data.fromID] >= Models.user.BOUNCER),b = data.message.indexOf('@') < 0 && this.isPlugCubedAdmin(data.fromID);
        if (a || b) {
            if (data.message.indexOf('!disable') > -1) {
                if (this.settings.autojoin) {
                    this.settings.autojoin = false;
                    this.changeGUIColor('join',this.settings.autojoin);
                    this.saveSettings();
                    API.waitListLeave();
                    API.sendChat('@' + data.from + ' Autojoin disabled');
                } else
                    API.sendChat('@' + data.from + ' Autojoin was not enabled');
            }
            if (data.message.indexOf('!afkdisable') > -1) {
                if (this.settings.autorespond) {
                    this.settings.autorespond = false;
                    this.changeGUIColor('autorespond',this.settings.autorespond);
                    this.saveSettings();
                    API.sendChat('@' + data.from + ' AFK message disabled');
                } else
                    API.sendChat('@' + data.from + ' AFK message was not enabled');
            }
            if (data.message.indexOf('!disable') > 0 || data.message.indexOf('!afkdisable') > 0) return;
        }
    },
    /**
     * @this {plugCubedModel}
     */
    onChat: function(data) {
        this.chatDisable(data);
        if (data.type == 'mention') {
            if (this.settings.autorespond && !this.settings.recent) {
                this.settings.recent = true;
                setTimeout(function() { plugCubed.settings.recent = false; plugCubed.saveSettings(); },180000);
                API.sendChat('@' + data.from + ' ' + this.settings.awaymsg);
            }
        } else for (var i in this.settings.alertson) {
            if (data.message.indexOf(this.settings.alertson[i]) > -1)
                document.getElementById("chat-sound").playMentionSound();
        }
        if (this.settings.chatlimit.enabled) {
            var elems = $('#chat-messages').children('div'),num = elems.length,i = 0;
            elems.each(function() {
                ++i;
                var a = num-plugCubed.settings.chatlimit.limit-1;
                if (i < a)
                    $(this).remove();
                else if (i == a && i%2 == 0)
                    $(this).remove();
            });
        }
    },
    /**
     * @this {plugCubedModel}
     */
    onUserlistUpdate: function() {
        if (this.settings.userlist)
            this.populateUserlist();
    },
    /**
     * @this {plugCubedModel}
     */
    getHistory: function() {
        var HSS = new HistorySelectService();
        HSS.successCallback = $.proxy(this.loadHistory,this);
    },
    /**
     * @this {plugCubedModel}
     */
    loadHistory: function(data) {
        this.history = [];
        for (var i in data) {
            var a = data[i],
            obj = {
                id: a.media.id,
                author: a.media.author,
                title: a.media.title,
                wasSkipped: false,
                user: {
                    id: a.user.id.toString(),
                    username: a.user.username
                }
            };
            this.history.push(obj);
        }
    },
    /**
     * @this {plugCubedModel}
     */
    onSkip: function() {
        this.history[1].wasSkipped = true;
    },
    /**
     * @this {plugCubedModel}
     */
    onHistoryCheck: function(id) {
        var found = -1;
        for (var i in this.history) {
            var a = this.history[i];
            if (a.id == id && (~~i + 2) < 51) {
                found = ~~i + 2;
                if (!a.wasSkipped) {
                    if (Popout == null || Popout == undefined) {
                        document.getElementById("chat-sound").playMentionSound();
                        setTimeout(function(){ document.getElementById("chat-sound").playMentionSound(); },100);
                    } else {
                        Popout.document.getElementById("chat-sound").playMentionSound();
                        setTimeout(function(){ Popout.document.getElementById("chat-sound").playMentionSound(); },100);
                    }
                    return Models.chat.onChatReceived({type: 'system',message: 'Song is in history (' + found + ' of ' + this.history.length + ')',language: Models.user.data.language});
                }
            }
        }
        if (found > 0)
            return Models.chat.onChatReceived({type: 'system',message: 'Song is in history (' + found + ' of ' + this.history.length + '), but was skipped on the last play',language: Models.user.data.language});
    },
    getTimestamp: function() {
        var time = new Date();
        var minutes = time.getMinutes();
        minutes = (minutes < 10 ? '0' : '') + minutes;
        return time.getHours() + ':' + minutes;
    },
    /**
     * @this {Models.chat}
     */
    customChatCommand: function(value) {
        if (this._chatCommand(value) === true) {
            if (value == '/stream on' || value == '/stream off')
                plugCubed.changeGUIColor('stream',!DB.settings.streamDisabled);
            if (value == '/afk' && plugCubed.settings.autojoin) {
                plugCubed.settings.autojoin = false;
                plugCubed.changeGUIColor('join',false);
                plugCubed.saveSettings();
            }
            return true;
        }
        if (value.indexOf('/commands') === 0) {
            var commands = [
                ['/nick'              ,'change username'],
                ['/idle'              ,'set status to idle'],
                ['/avail'             ,'set status to available'],
                ['/afk'               ,'set status to afk'],
                ['/work'              ,'set status to working'],
                ['/sleep'             ,'set status to sleeping'],
                ['/join'              ,'join dj booth/waitlist'],
                ['/leave'             ,'leaves dj booth/waitlist'],
                ['/whoami'            ,'get your own information'],
                ['/mute'              ,'set volume to 0'],
                ['/automute'          ,'register currently playing song to automatically mute on future plays'],
                ['/unmute'            ,'set volume to last volume'],
                ['/woot'              ,'woots current song'],
                ['/meh'               ,'mehs current song'],
                ['/refresh'           ,'refresh the video'],
                ['/ignore (username)' ,'ignore all chat messages from user'],
                ['/alertson (word)'   ,'play mention sound whenever word is written in chat'],
                ['/curate'            ,'add current song to your selected playlist'],
                ['/getpos'            ,'get current waitlist position'],
                ['/version'           ,'displays version number'],
                ['/commands'          ,'shows this list'],
                ['/link'              ,'paste link to plugCubed website in chat']
            ];
            var userCommands = '<table>';
            for (var i in commands)
                userCommands += '<tr><td>' + commands[i][0] + '</td><td>' + commands[i][1] + '</td></tr>';
            userCommands += '</table>';
            if (Models.user.hasPermission(Models.user.BOUNCER)) {
                commands = [
                    ['/whois (username)'    ,'gives general information about user'         ,Models.user.BOUNCER],
                    ['/skip'                ,'skip current song'                            ,Models.user.BOUNCER],
                    ['/kick (username)'     ,'kicks targeted user'                          ,Models.user.BOUNCER],
                    ['/lock'                ,'locks DJ booth'                               ,Models.user.MANAGER],
                    ['/unlock'              ,'unlocks DJ booth'                             ,Models.user.MANAGER],
                    ['/add (username)'      ,'adds targeted user to dj booth/waitlist'      ,Models.user.BOUNCER],
                    ['/remove (username)'   ,'removes targeted user from dj booth/waitlist' ,Models.user.BOUNCER]
                ];
                var modCommands = '<table>';
                for (var i in commands) {
                    if (Models.user.hasPermission(commands[i][2]))
                        modCommands += '<tr><td>' + commands[i][0] + '</td><td>' + commands[i][1] + '</td></tr>';
                }
                modCommands += '</table>';
                Dialog.showPlugCubedCommands(userCommands,modCommands);
            } else
                Dialog.showPlugCubedCommands(userCommands);
            return true;
        }
        if (value == '/idle') {
            Models.user.changeStatus(-1);
            return true;
        }
        if (value == '/avail' || value == '/available') {
            Models.user.changeStatus(0);
            return true;
        }
        if (value == '/brb' || value == '/away') {
            Models.user.changeStatus(1);
            if (plugCubed.settings.autojoin) {
                plugCubed.settings.autojoin = false;
                plugCubed.changeGUIColor('join',false);
                plugCubed.saveSettings();
            }
            return true;
        }
        if (value == '/work' || value == '/working') {
            Models.user.changeStatus(2);
            return true;
        }
        if (value == '/sleep' || value == '/sleeping') {
            Models.user.changeStatus(3);
            if (plugCubed.settings.autojoin) {
                plugCubed.settings.autojoin = false;
                plugCubed.changeGUIColor('join',false);
                plugCubed.saveSettings();
            }
            return true;
        }
        if (value == '/join')
            return Room.onWaitListJoinClick(), true;
        if (value == '/leave')
            return API.waitListLeave(),true;
        if (value == '/whoami')
            return plugCubed.getUserInfo(Models.user.data.id),true;
        if (value == '/woot')
            return $('#button-vote-positive').click(), true;
        if (value == '/meh')
            return $('#button-vote-negative').click(), true;
        if (value == '/refresh')
            return $('#button-refresh').click(), true;
        if (value == '/version')
            return plugCubed.log(this.i18n('running',[plugCubed.version.toString()]), null, plugCubed.colors.infoMessage1), true;
        if (value == '/mute')
            return Playback.setVolume(0), true;
        if (value == '/link')
            return Models.chat.sendChat('plugCubed : http://tatdk.github.io/plugCubed'), true;
        if (value == '/unmute')
            return Playback.setVolume(Playback.lastVolume), true;
        if (plugCubed.detectPdP() && value == '/muteone' || plugCubed.detectPdP() && value == '/singlemute')
            return $('#button-sound').click(), $('#button-sound').click(), true;
        if (value.indexOf('/nick ') === 0)
            return Models.user.changeDisplayName(value.substr(6)), true;
        if (value.indexOf('/curate') === 0) {
            new DJCurateService(Models.playlist.selectedPlaylistID);
            setTimeout(function() { Dialog.closeDialog(); },500);
            return true;
        }
        if (value == '/nextsong') {
            var a = Models.playlistMedia(Models.playlist.selectedPlaylistID).data[0];
            if (a.id === Models.room.data.media.id && Models.room.data.currentDJ === Models.user.data.id)
                a = Models.playlistMedia(Models.playlist.selectedPlaylistID).data[1];
            var found = -1;
            for (var i in plugCubed.history) {
                var b = plugCubed.history[i];
                if (b.id == a.id && ~~i + 1 < 51) {
                    found = ~~i + 1;
                    break;
                }
            }
            if (found > 0)
                return log('<span style="color:'+ plugCubed.colors.infoMessage1 +  '">' + plugCubed('nextsong',[a.title,a.author]) + '</span><br /><span style="color:' + plugCubed.colors.modCommands + '"><strong>' + plugCubed.i18n('isHistory',[found,plugCubed.history.length]) + '</strong></span>'), true;
            else
                return plugCubed.log(plugCubed('nextsong',[a.title,a.author]), null, plugCubed.colors.infoMessage1), true;
        }
        if (value == '/automute') {
            if (plugCubed.settings.registeredSongs.indexOf(Models.room.data.media.id) < 0) {
                plugCubed.settings.registeredSongs.push(Models.room.data.media.id);
                plugCubed.settings.autoMuted = true;
                Playback.setVolume(0);
                plugCubed.log(Models.room.data.media.title + ' registered to auto-mute on future plays.', null, plugCubed.colors.infoMessage2);
            } else {
                plugCubed.settings.registeredSongs.splice(plugCubed.settings.registeredSongs.indexOf(Models.room.data.media.id), 1);
                plugCubed.settings.autoMuted = false;
                Playback.setVolume(Playback.lastVolume);
                plugCubed.log(Models.room.data.media.title + ' removed from automute registry.', null, plugCubed.colors.infoMessage2);
            }
                plugCubed.saveSettings();
            return true;
        }
        if (value == '/alertsoff') {
            if (plugCubed.settings.notify) {
                plugCubed.log(plugCubed.i18n('notify.message.disabled'), null, plugCubed.colors.infoMessage1);
                plugCubed.settings.notify = false;
                plugCubed.changeGUIColor('notify',false);
            }
            return true;
        }
        if (value == '/alertson') {
            if (!plugCubed.settings.notify) {
                plugCubed.log(plugCubed.i18n('notify.message.enabled'), null, plugCubed.colors.infoMessage1);
                plugCubed.settings.notify = true;
                plugCubed.changeGUIColor('notify',true);
            }
            return true;
        }
        if (value.indexOf('/getpos') === 0) {
            var lookup = plugCubed.getUser(value.substr(8)),
                user = lookup === null ? Models.user.data : lookup,
                spot = Models.room.getWaitListPosition(user.id);
            if (spot !== null)
                plugCubed.log(plugCubed.i18n('info.inwaitlist',[spot,Models.room.data.waitList.length]), null, plugCubed.colors.infoMessage2);
            else {
                spot = -1;
                for (var i = 0;i < Models.room.data.djs.length;i++)
                    spot = Models.room.data.djs[i].user.id === user.id ? i : spot;
                if (spot < 0)
                    plugCubed.log(plugCubed.i18n('info.notinlist'), null, plugCubed.colors.infoMessage2);
                else if (spot === 0)
                    plugCubed.log(plugCubed.i18n('info.userDjing',[user.id === Models.user.data.id ? plugCubed.i18n('you') : user.username]),null,plugCubed.colors.infoMessage2);
                else if (spot === 1)
                    plugCubed.log(plugCubed.i18n('info.userNextDJ',[user.id === Models.user.data.id ? plugCubed.i18n('you') : user.username]),null,plugCubed.colors.infoMessage2);
                else
                    plugCubed.log(plugCubed.i18n('info.inbooth',[spot + 1,Models.room.data.djs.length]), null, plugCubed.colors.infoMessage2);
            }
            return true;
        }
        if (value.indexOf('/ignore ') === 0 || value.indexOf('/unignore ') === 0) {
            var user = plugCubed.getUser(value.substr(8));
            if (user === null) return plugCubed.log(plugCubed.i18n('error.userNotFound'), null, plugCubed.colors.infoMessage2),true;
            if (user.id === Models.user.data.id) return plugCubed.log(plugCubed.i18n('error.ignoreSelf'), null, plugCubed.colors.infoMessage2),true;
            if (plugCubed.settings.ignore.indexOf(user.id) > -1) return plugCubed.settings.ignore.splice(plugCubed.settings.ignore.indexOf(user.id),1),plugCubed.saveSettings(),log(plugCubed.i18n('ignore.disabled',[user.username])),true;
            return plugCubed.settings.ignore.push(user.id),plugCubed.saveSettings(),log(plugCubed.i18n('ignore.enabled',[user.username])),true;
        }
        if (plugCubed.isPlugCubedAdmin(Models.user.data.id)) {
            if (value.indexOf('/whois ') === 0)
                return plugCubed.getUserInfo(value.substr(7)),true;
        }
        if (Models.user.hasPermission(Models.user.BOUNCER)) {
            if (value.indexOf('/skip') === 0) {
                if (Models.room.data.djs[0].user.id == Models.user.data.id) {
                    Room.onSkipClick();
                    return true;
                } else {
                    var reason = value.substr(5).trim(),
                        user = plugCubed.getUser(Models.room.data.currentDJ);
                    if (reason)
                        API.sendChat((user != null ? '@' + user.username + ' - ' : '') + 'Reason for skip: ' + reason);
                    new ModerationForceSkipService();
                    return true;
                }
            }
            if (value.indexOf('/whois ') === 0)
                return plugCubed.getUserInfo(value.substr(7)),true;
            if (value.indexOf('/kick ') === 0) {
                if (value.indexOf('::') > 0) {
                    var data = value.substr(6).split(':: '),
                        time = 60;
                        if (data.length == 2) {
                            if (data[1].isNumber())
                                time = parseFloat(data[1]);
                            user = plugCubed.getUser(data[0]);
                            return new ModerationKickUserService(user.id,(data[1].isNumber()?' ':data[1]),time),true;
                        } else if (data.length == 3) {
                            time = parseFloat(data[2]);
                            user = plugCubed.getUser(data[0]);
                            return new ModerationKickUserService(user.id,data[1],time),true;
                        }
                } else
                    return plugCubed.moderation(value.substr(6),'kick'),true;
            }
            if (value.indexOf('/add ') === 0)
                return plugCubed.moderation(value.substr(5),'adddj'),true;
            if (value.indexOf('/remove ') === 0)
                return plugCubed.moderation(value.substr(8),'removedj'),true;
        }
        if (Models.user.hasPermission(Models.user.MANAGER)) {
            if (value === '/lock') {
                new RoomPropsService(document.location.href.split('/')[3],true,Models.room.data.waitListEnabled,Models.room.data.maxPlays,Models.room.data.maxDJs);
                return true;
            }
            if (value === '/unlock') {
                new RoomPropsService(document.location.href.split('/')[3],false,Models.room.data.waitListEnabled,Models.room.data.maxPlays,Models.room.data.maxDJs);
                return true;
            }
        }
        return false;
    }
});
if (localStorage.plugCubedLang === undefined) {
    var plugCubed = null;
    (function() {
        var a = Class.extend({
            init: function() {
                $('#overlay-container').append($('#avatar-overlay').clone(false,false).attr('id','plugCubedLang-overlay').width(800).height(600).css('position','absolute'));
                $('#plugCubedLang-overlay').find('.overlay-title').html('plug&#179; language');
                $('#plugCubedLang-overlay').find('#avatar-sets').remove();
                $('#plugCubedLang-overlay').find('#avatar-panel').attr('id','plugCubedLang-panel').css('padding-top','60px');
                $('#plugCubedLang-overlay').find('.overlay-close-button').click($.proxy(this.hide,this));
                this.initLanguages();
            },
            show: function() {
                UserListOverlay.hide();
                $("#lobby-overlay").hide();
                $("#media-overlay").hide();
                $("#avatar-overlay").hide();
                $("#plugCubedLang-overlay").show();
                $("#overlay-container").show();
                this.draw();
            },
            hide: function() {
                UserListOverlay.hide();
                $("#lobby-overlay").hide();
                $("#media-overlay").hide();
                $("#avatar-overlay").hide();
                $("#plugCubedLang-overlay").hide();
                $("#overlay-container").hide();
            },
            draw: function() {
                $("#plugCubedLang-panel").html("").scrollTop(0);
                var i,len = this.languages.length,container = $('<div/>');
                if (len > 5) {
                    for (var j = 0;j<len/5;j++)
                        container.append(this.drawRow(this.languages.slice(j*5,j*5+5)).css('top',j*75));
                } else container.append(this.drawRow(this.languages).css('top',j*75));
                $("#plugCubedLang-panel").append(container);
                $(".lang-button").click($.proxy(this.onLangClick, this));
            },
            drawRow: function(languages) {
                var row = $("<div/>").addClass("lang-row"),
                    len = languages.length,
                    x = len == 5 ? 0 : len == 4 ? 75 : len == 3 ? 150 : len == 2 ? 225 : 300;
                for (var i = 0; i < len; ++i) {
                    var button = $("<div/>").addClass("lang-button").css('display','inline-block').css("left", x).data("language", languages[i].file).css("cursor", "pointer").append($("<img/>").attr("src", 'https://rawgithub.com/TATDK/plugCubed/1.7.0/flags/flag.' + languages[i].file + '.png').attr('alt',languages[i].name).height(75).width(150));
                    row.append(button);
                    x += 150;
                }
                return row;
            },
            onLangClick: function(a) {
                a = $(a.currentTarget);
                localStorage.plugCubedLang = a.data('language');
                plugCubed = new plugCubedModel();
                this.hide();
            },
            initLanguages: function() {
                /*
                var a = Models.room.data.description;
                if (a.indexOf('@p3=') > -1) {
                    a = a.substr(a.indexOf('@p3=')+4);
                    if (a.indexOf(' ') > -1)
                        a.substr(0,a.indexOf(' '));
                    if (a.indexOf('\n') > -1)
                        a.substr(0,a.indexOf('\n'));
                }
                */

                var self = this;

                this.languages = [];

                $.getJSON('https://rawgithub.com/TATDK/plugCubed/1.7.0/lang.txt',function(data) { self.languages = data; self.show(); })
                .done(function() { if (self.languages.length === 0) log('<span style="color:#FF0000">Error loading plugCubed</span>'); });
            }
        });
        new a();
    })();
} else var plugCubed = new plugCubedModel();
