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

function NotImplementedError(a) {
    this.name = 'NotImplementedError';
    this.message = a || '';
}
NotImplementedError.prototype = Error.prototype;

if (typeof plugCubed !== 'undefined') plugCubed.close();
String.prototype.equalsIgnoreCase     = function(other)    { return typeof other !== 'string' ? false : this.toLowerCase() === other.toLowerCase(); };
String.prototype.startsWith           = function(other)    { return typeof other !== 'string' || other.length > this.length ? false : this.indexOf(other) === 0; };
String.prototype.endsWith             = function(other)    { return typeof other !== 'string' || other.length > this.length ? false : this.indexOf(other) === this.length-other.length; };
String.prototype.startsWithIgnoreCase = function(other)    { return typeof other !== 'string' || other.length > this.length ? false : this.toLowerCase().startsWith(other.toLowerCase()); };
String.prototype.endsWithIgnoreCase   = function(other)    { return typeof other !== 'string' || other.length > this.length ? false : this.toLowerCase().endsWith(other.toLowerCase()); };
String.prototype.isNumber             = function()         { return !isNaN(parseInt(this,10)) && isFinite(this); };
String.prototype.isHEX                = function()         { return /(^#[0-9A-F]{6}$)|(^#[0-9A-F]{3}$)/i.test(this.substr(0,1) === '#' ? this : '#' + this); };
Math.randomRange                      = function(min, max) { return min + Math.floor(Math.random()*(max-min+1)); };
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

(function(){var a=!1,b=/xyz/.test(function(){xyz})?/\b_super\b/:/.*/;this.Class=function(){};Class.extend=function(c){function d(){!a&&this.init&&this.init.apply(this,arguments)}var e=this.prototype;a=!0;var f=new this;a=!1;for(var g in c)f[g]="function"==typeof c[g]&&"function"==typeof e[g]&&b.test(c[g])?function(a,b){return function(){var c=this._super;this._super=e[a];var d=b.apply(this,arguments);this._super=c;return d}}(g,c[g]):c[g];d.prototype=f;d.prototype.constructor=d;d.extend=arguments.callee;return d}})();

var _PCL,
disconnected = false,
plugCubedModel = Class.extend({
    guiButtons: {},
    version: {
        major: 1,
        minor: 7,
        patch: 0,
        prerelease: 'alpha.3',
        /**
         * @this {plugCubedModel.version}
         */
        toString: function() {
            return this.major + '.' + this.minor + '.' + this.patch + (this.prerelease !== undefined ? '-' + this.prerelease : '');
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
            onSkip:               $.proxy(this.onSkip,          this),
            onRoomJoin:           $.proxy(this.onRoomJoin,      this)
        };
        //Load language and third-party scripts
        if (localStorage.plugCubedLang === undefined) return;
        $.getScript('https://rawgithub.com/TATDK/plugCubed/1.7.0-new/langs/lang.' + localStorage.plugCubedLang + '.js',$.proxy(this.__init,this));
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
        this.userData = {};

        this.minified = false;
        this.colors = {
            userCommands: '66FFFF',
            modCommands:  'FF0000',
            infoMessage1: 'FFFF00',
            infoMessage2: '66FFFF'
        };
        this.defaultAwayMsg = this.i18n('AFK');

        setTimeout(function() {
            plugCubed.history = {};
            var data = API.getHistory();
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
                plugCubed.history.push(obj);
            }
        },1);

        this.customColorsStyle = $('<style type="text/css" />');
        $('head').append(this.customColorsStyle);

        API.chatLog(this.i18n('running',[this.version.toString()]));
        API.chatLog(this.i18n('commandsHelp'));

        if (window.history && history.pushState) {
            (function(history){
                if (this.history.plugCubedWasHere === undefined) {
                    var ev = new CustomEvent('pushState'),
                        pushState = history.pushState;
                        this.history.plugCubedWasHere = true;
                    history.pushState = function(state) {
                        window.dispatchEvent(ev);
                        return pushState.apply(history, arguments);
                    }
                }
            })(window.history);
            window.addEventListener('pushState',this.proxy.onRoomJoin);
        }

        Dialog = {};
        /**
         * @this {Dialog}
         */
        Dialog.showPlugCubedCommands = function(user,mod) {
            throw new NotImplementedError();
        };

        socket = {};
        /**
         * @this {socket}
         */
        socket.chat = function(a) {
            throw new NotImplementedError();
        }

        API.on(API.CHAT_COMMAND,this.customChatCommand);
        
        this.loadSettings();
        $('body').prepend('<link rel="stylesheet" type="text/css" id="plugcubed-css" href="https://rawgithub.com/TATDK/plugCubed/1.7.0-new/plugCubed.css" />');
        $('body').append(
            '<div id="side-left" class="sidebar"><div class="sidebar-content"></div></div>' +
            '<div id="side-right" class="sidebar"><div class="sidebar-handle"><span>||</span></div><div class="sidebar-content"></div></div>'
        ).append('<script type="text/javascript" src="https://rawgithub.com/TATDK/plugCubed/1.7.0-new/thirdparty.js"></script>');
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


        SocketListener = {};
        SocketListener.chat = function(a) {
            throw new NotImplementedError();
            if (typeof plugCubed !== 'undefined' && a.fromID && plugCubed.settings.ignore.indexOf(a.fromID) > -1)
                return plugCubed.chatDisable(a);
            Models.chat.receive(a);
            API.delayDispatch(API.CHAT,a);
        };

        this.Socket();
    },
    onRoomJoin: function() {
        if (typeof plugCubed !== 'undefined') {
            setTimeout(function() {
                if (API.enabled) {
                    plugCubed.close();
                    plugCubed = new plugCubedModel();
                } else plugCubed.onRoomJoin();
            },500);
        }
    },
    /**
     * @this {plugCubedModel}
     */
    close: function() {
        API.off(API.CHAT_COMMAND,               this.customChatCommand);
        API.off(API.DJ_ADVANCE,                 this.proxy.onDjAdvance);
        API.off(API.VOTE_UPDATE,                this.proxy.onVoteUpdate);
        API.off(API.CURATE_UPDATE,              this.proxy.onCurate);
        API.off(API.USER_JOIN,                  this.proxy.onUserJoin);
        API.off(API.USER_LEAVE,                 this.proxy.onUserLeave);
        API.off(API.CHAT,                       this.proxy.onChat);
        API.off(API.VOTE_SKIP,                  this.proxy.onSkip);
        API.off(API.USER_SKIP,                  this.proxy.onSkip);
        API.off(API.MOD_SKIP,                   this.proxy.onSkip);
        API.off(API.WAIT_LIST_UPDATE,           this.proxy.onUserlistUpdate);
        window.removeEventListener('pushState', this.proxy.onRoomJoined);
        for (var i in plugCubed.guiButtons) {
            if (i === undefined || plugCubed.guiButtons[i] === undefined) continue;
            $('#plugcubed-btn-' + i).unbind();
            delete plugCubed.guiButtons[i];
        }
        $('#plugcubed-css').remove();
        $('#plugcubed-js-extra').remove();
        $('#side-right').remove();
        $('#side-left').remove();
        //this.customColorsStyle.remove();
        if (this.socket) {
            this.socket.onclose = function() {};
            this.socket.close();
        }
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
            var userData = API.getUser();
            this.send(JSON.stringify({
                type:     'userdata',
                id:       userData.id,
                username: userData.username,
                room:     window.location.pathname.split('/')[1],
                version:  plugCubed.version.toString()
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
                API.chatLog(plugCubed.i18n('newVersion'), null, plugCubed.colors.infoMessage1);
                setTimeout(function() { $.getScript('https://rawgithub.com/TATDK/plugCubed/1.7.0-new/plugCubed.' + (plugCubed.minified ? 'min.' : '') + 'js'); },5000);
                return;
            }
            if (data.type === 'chat') SocketListener.chat(data.data);
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
    },
    /**
     * @this {plugCubedModel}
     */
    hideUserlist: function() {
        var sbarWidth = -$('#side-left').width()-20;
        $('#side-left').animate({ 'left': sbarWidth + 'px' }, 300, typeof jQuery.easing.easeOutQuart === 'undefined' ? undefined : 'easeOutQuart', function() {
            $('#side-left').hide();
        });
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
            API.setVolume(0);
            this.settings.autoMuted = true;
            API.chatLog(this.i18n('automuted',[Models.room.data.media.title]));
        };
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
        API.on(API.DJ_ADVANCE,       this.proxy.onDjAdvance);
        API.on(API.VOTE_UPDATE,      this.proxy.onVoteUpdate);
        API.on(API.CURATE_UPDATE,    this.proxy.onCurate);
        API.on(API.USER_JOIN,        this.proxy.onUserJoin);
        API.on(API.USER_LEAVE,       this.proxy.onUserLeave);
        API.on(API.CHAT,             this.proxy.onChat);
        API.on(API.VOTE_SKIP,        this.proxy.onSkip);
        API.on(API.USER_SKIP,        this.proxy.onSkip);
        API.on(API.MOD_SKIP,         this.proxy.onSkip);
        API.on(API.WAIT_LIST_UPDATE, this.proxy.onUserlistUpdate);
    },
    /**
     * @this {plugCubedModel}
     */
    initGUI: function() {
        $('#side-right .sidebar-content').html('');
        this.addGUIButton(this.settings.autowoot,                                                            'woot',        this.i18n('menu.autowoot'));
        this.addGUIButton(this.settings.autojoin,                                                            'join',        this.i18n('menu.autojoin'));
        this.addGUIButton(this.settings.userlist,                                                            'userlist',    this.i18n('menu.userlist'));
        this.addGUIButton(this.settings.customColors,                                                        'colors',      this.i18n('menu.customchatcolors'));
        this.addGUIButton(this.settings.autorespond,                                                         'autorespond', this.i18n('menu.afkstatus'));
        this.addGUIButton(this.settings.notify,                                                              'notify',      this.i18n('menu.notify'));
        this.addGUIButton(this.settings.chatlimit.enabled,                                                   'chatlimit',   this.i18n('menu.limitchatlog'));
        this.addGUIButton(!JSON.parse(require('app/store/LocalStorage').getItem('settings')).streamDisabled, 'stream',      this.i18n('menu.stream'));
        this.addGUIButton(this.settings.emoji,                                                               'emoji',       this.i18n('menu.emoji'));
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
        var spot = API.getWaitListPosition();
        var waitlistDiv = $('<h3></h3>').addClass('waitlistspot').text('Waitlist: ' + (spot != -1 ? spot + ' / ' : '') + API.getWaitList().length);
        $('#side-left .sidebar-content').append(waitlistDiv).append('<hr />');
        var users = API.getUsers();
        for (var i in users)
            this.appendUser(users[i]);
    },
    /**
     * @this {plugCubedModel}
     */
    appendUser: function(user) {
        var prefix,username = require("app/utils/Utilities").cleanTypedString(user.username);

             if (user.curated == true)                           prefix = 'curate';
        else if (this.isPlugCubedAdmin(user.id))                 prefix = 'plugcubed';
        else if (this.isPlugCubedVIP(user.id))                   prefix = 'vip';
        else if (API.hasPermission(user.id,API.ROLE.ADMIN))      prefix = 'admin';
        else if (API.hasPermission(user.id,API.ROLE.AMBASSADOR)) prefix = 'ambassador';
        else if (API.hasPermission(user.id,API.ROLE.HOST))       prefix = 'host';
        else if (API.hasPermission(user.id,API.ROLE.COHOST))     prefix = 'host';
        else if (API.hasPermission(user.id,API.ROLE.MANAGER))    prefix = 'manager';
        else if (API.hasPermission(user.id,API.ROLE.BOUNCER))    prefix = 'bouncer';       
        else if (API.hasPermission(user.id,API.ROLE.FEATUREDDJ)) prefix = 'fdj';
        else                                                     prefix = 'normal';
        if (API.getDJs.length > 0 && API.getDJs()[0].user.id == user.id)
            this.appendUserItem(prefix === 'normal' ? 'void' : prefix + '_current', '#66FFFF', user.username);
        else
            this.appendUserItem(prefix === 'normal' ? 'void' : prefix + this.prefixByVote(user.vote),this.colorByVote(user.vote), username);
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
                                    if (API.hasPermission(undefined,API.ROLE.BOUNCER) || plugCubed.isPlugCubedAdmin(API.getUser().id))
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
        if (Models.room.data.staff[API.getSelf().id] && Models.room.data.staff[API.getSelf().id] >= API.ROLE.BOUNCER) {
            var service;
            switch (type) {
                case 'kick':     service = moderateKickUser; break;
                case 'removedj': service = moderateRemoveDJ; break;
                case 'adddj':    service = moderateAddDJ;    break;
                default:         API.chatLog(this.i18n('error.unknownModeration')); return;
            }
            var user = this.getUser(target);
            if (user === null) API.chatLog(this.i18n('error.userNotFound'));
            else               API[service](user.id,' ');
        }
    },
    /**
     * @this {plugCubedModel}
     */
    getUserInfo: function(data) {
        var user = this.getUser(data);
        if (user === null) API.chatLog(this.i18n('error.userNotFound'));
        else {
            var rank,
                status,
                voted,
                position,
                points      = user.djPoints + user.curatorPoints + user.listenerPoints,
                voteTotal   = user.wootcount + user.mehcount,
                waitlistpos = API.getWaitListPos(),
                boothpos    = -1,
                djs         = API.getDJs();

                 if (API.hasPermission(user.id,API.ROLE.FEATUREDDJ)) rank = this.i18n('ranks.featureddj');
            else if (API.hasPermission(user.id,API.ROLE.BOUNCER))    rank = this.i18n('ranks.bouncer');
            else if (API.hasPermission(user.id,API.ROLE.MANAGER))    rank = this.i18n('ranks.manager');
            else if (API.hasPermission(user.id,API.ROLE.COHOST))     rank = this.i18n('ranks.cohost');
            else if (API.hasPermission(user.id,API.ROLE.HOST))       rank = this.i18n('ranks.host');
            else if (API.hasPermission(user.id,API.ROLE.AMBASSADOR)) rank = this.i18n('ranks.ambassador');
            else if (API.hasPermission(user.id,API.ROLE.ADMIN))      rank = this.i18n('ranks.admin');
            else                                                     rank = this.i18n('ranks.regular');

            if (waitlistpos === 0) {
                if (djs.length > 0 && djs[0].user.id === user.id) {
                    position = this.i18n('info.djing');
                    boothpos = 0;
                } else {
                    for (var i = 1;i < djs.length;i++)
                        boothpos = djs.user.id === user.id ? i : boothpos;
                    if (boothpos < 0)
                        position = this.i18n('info.notinlist');
                    else
                        position = this.i18n('info.inbooth',[boothpos + 1,djs.length]);
                }
            } else
                position = this.i18n('info.inwaitlist',[waitlistpos,API.getWaitList().length]);

            switch (user.status) {
                default:                  status = this.i18n('status.available'); break;
                case API.STATUS.AFK:      status = this.i18n('status.afk');       break;
                case API.STATUS.WORKING:  status = this.i18n('status.working');   break;
                case API.STATUS.SLEEPING: status = this.i18n('status.sleeping');  break;
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

            throw new NotImplementedError();

            //Create dialog for this

            /*log('<table style="width:100%;color:#CC00CC"><tr><td colspan="2"><strong>' + this.i18n('info.name') + '</strong>: <span style="color:#FFFFFF">' + user.username + '</span></td></tr>' +
            (title ? '<tr><td colspan="2"><strong>' + this.i18n('info.title') + '</strong>: <span style="color:#FFFFFF">' + title + '</span></td></tr>' : '') +
            '<tr><td colspan="2"><strong>' + this.i18n('info.id') + '</strong>: <span style="color:#FFFFFF">' + user.id + '</span></td></tr>' +
            '<tr><td><strong> ' + this.i18n('info.rank') + '</strong>: <span style="color:#FFFFFF">' + rank + '</span></td><td><strong>' + this.i18n('info.joined') + '</strong>: <span style="color:#FFFFFF">' + user.joinTime + '</span></td></tr>' +
            '<tr><td><strong>' + this.i18n('info.status') + '</strong>: <span style="color:#FFFFFF">' + status + '</span></td><td><strong> ' + this.i18n('info.vote') + '</strong>: <span style="color:#FFFFFF">' + voted + '</span></td></tr>' +
            '<tr><td colspan="2"><strong>' + this.i18n('info.position') + '</strong>: <span style="color:#FFFFFF">' + position + '</span></td></tr>' +
            '<tr><td><strong>' + this.i18n('info.points') + '</strong>: <span style="color:#FFFFFF" title = "' + this.i18n('info.pointType.dj',[user.djPoints]) + '  +  ' + this.i18n('info.pointType.listener',[user.listenerPoints]) + '  +  ' + this.i18n('info.pointType.curator',[user.curatorPoints]) + '">' + points + '</span></td><td><strong> ' + this.i18n('info.fans') + '</strong>: <span style="color:#FFFFFF">' + user.fans + '</span></td></tr>' +
            '<tr><td><strong>' + this.i18n('info.wootCount') + '</strong>: <span style="color:#FFFFFF">' + user.wootcount + '</span></td><td><strong>' + this.i18n('info.mehCount') + '</strong>: <span style="color:#FFFFFF">' + user.mehcount + '</span></td></tr>' +
            '<tr><td colspan="2"><strong>' + this.i18n('info.ratio') + '</strong>: <span style="color:#FFFFFF">' + (voteTotal === 0 ? '0' : (user.wootcount/voteTotal).toFixed(2)) + '</span></td></tr></table>');*/
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
                    API.djJoin();
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
                throw new NotImplementedError();
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
                    if (API.getUser().status <= 0)
                        API.setStatus(API.STATUS.AFK);
                } else API.setStatus(API.STATUS.AVAILABLE);
                break;
            case 'notify':
                throw new NotImplementedError();
                break;
            case 'chatlimit':
                throw new NotImplementedError();
                break;
            case 'stream':
                var a = JSON.parse(require('app/store/LocalStorage').getItem('settings')).streamDisabled;
                this.changeGUIColor('stream',a);
                return API.sendChat(a ? '/stream on' : '/stream off');
                break;
            case 'emoji':
                this.settings.emoji = !this.settings.emoji;
                this.changeGUIColor('emoji',this.settings.emoji);
                break;
            default: return API.chatLog(this.i18n('menu.unknown'));
        }
        this.saveSettings();
    },
    /**
     * @this {plugCubedModel}
     */
    onNotifySubmit: function() {
        throw new NotImplementedError();
    },
    /**
     * @this {plugCubedModel}
     */
    onChatLimitSubmit: function() {
        throw new NotImplementedError();
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
        throw new NotImplementedError();
    },
    /**
     * @this {plugCubedModel}
     */
    onVoteUpdate: function(data) {
        if (!data || !data.user) return;
        var a = API.getUser(data.user.id);
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
            API.chatLog(this.i18n('notify.message.curate',[data.user.username,media.author,media.title]));
        API.getUser(data.user.id).curated = true;
        this.onUserlistUpdate();
    },
    /**
     * @this {plugCubedModel}
     */
    onDjAdvance: function(data) {
        if (this.settings.notify === true) {
            if (this.settings.alerts.songStats === true) API.chatLog(this.i18n('notify.message.stats',[data.lastPlay.score.positive,data.lastPlay.score.negative,data.lastPlay.score.curates]))
            if (this.settings.alerts.songUpdate === true) API.chatLog(this.i18n('notify.message.updates',[data.media.title,data.media.author,data.dj.username]))
        }
        setTimeout($.proxy(this.onDjAdvanceLate,this),Math.randomRange(1,10)*1000);
        if (API.getUser().permission >= 2 || this.isPlugCubedAdmin(API.getUser().id)) this.onHistoryCheck(data.media.id)
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
        this.history.unshift(obj);
        this.history.splice(50,this.history.length-50);
        if (this.settings.autoMuted && this.settings.registeredSongs.indexOf(data.media.id) < 0) {
            setTimeout(function(){ API.setVolume(plugCubed.lastVolume); },800);
            this.settings.autoMuted = false;
        }
        if (!this.settings.autoMuted && this.settings.registeredSongs.indexOf(data.media.id) > -1) {
            setTimeout(function() { API.setVolume(0); }, 800);
            this.settings.autoMuted = true;
            this.lastVolume = API.getVolume();
            API.chatLog(i18n('automuted',[data.media.title]));

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
        if (this.settings.autowoot && this.settings.registeredSongs.indexOf(API.getHistory()[0].media.id) < 0) this.woot();
        if (this.settings.autojoin) {
            if ($('#button-dj-play').css('display') === 'block' || $('#button-dj-waitlist-join').css('display') === 'block')
                API.djJoin();
        }
    },
    woot: function() {
        if (API.getDJs().length === 0) return;
        var dj = API.getDJs()[0];
        if (dj === null || dj == API.getUser()) return;
        $('#button-vote-positive').click();
    },
    /**
     * @this {plugCubedModel}
     */
    onUserJoin: function(data) {
        if (this.settings.notify === true && this.settings.alerts.join === true)
            API.chatLog(require("app/utils/Utilities").cleanTypedString(data.username + ' joined the room'));
        var a = API.getUser(data.id);
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
            API.chatLog(require("app/utils/Utilities").cleanTypedString(data.username + ' left the room'));
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
        var a = data.type == 'mention' && (API.hasPermission(data.fromID,API.ROLE.BOUNCER)),b = data.message.indexOf('@') < 0 && this.isPlugCubedAdmin(data.fromID);
        if (a || b) {
            if (data.message.indexOf('!disable') > -1) {
                if (this.settings.autojoin) {
                    this.settings.autojoin = false;
                    this.changeGUIColor('join',this.settings.autojoin);
                    this.saveSettings();
                    API.djLeave();
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
                    return API.chatLog('Song is in history (' + found + ' of ' + this.history.length + ')',true);
                }
            }
        }
        if (found > 0)
            return API.chatLog('Song is in history (' + found + ' of ' + this.history.length + '), but was skipped on the last play',true);
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
        /*if (this._chatCommand(value) === true) {
            if (value == '/stream on' || value == '/stream off')
                plugCubed.changeGUIColor('stream',!DB.settings.streamDisabled);
            if (value == '/afk' && plugCubed.settings.autojoin) {
                plugCubed.settings.autojoin = false;
                plugCubed.changeGUIColor('join',false);
                plugCubed.saveSettings();
            }
            return true;
        }*/
        if (value.indexOf('/commands') === 0) {
            var commands = [
                ['/nick'              ,'change username'],
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
            if (API.hasPermission(undefined,API.ROLE.BOUNCER)) {
                commands = [
                    ['/whois (username)'    ,'gives general information about user'         ,API.ROLE.BOUNCER],
                    ['/skip'                ,'skip current song'                            ,API.ROLE.BOUNCER],
                    ['/kick (username)'     ,'kicks targeted user'                          ,API.ROLE.BOUNCER],
                    ['/lock'                ,'locks DJ booth'                               ,API.ROLE.MANAGER],
                    ['/unlock'              ,'unlocks DJ booth'                             ,API.ROLE.MANAGER],
                    ['/add (username)'      ,'adds targeted user to dj booth/waitlist'      ,API.ROLE.BOUNCER],
                    ['/remove (username)'   ,'removes targeted user from dj booth/waitlist' ,API.ROLE.BOUNCER]
                ];
                var modCommands = '<table>';
                for (var i in commands) {
                    if (API.hasPermission(commands[i][2]))
                        modCommands += '<tr><td>' + commands[i][0] + '</td><td>' + commands[i][1] + '</td></tr>';
                }
                modCommands += '</table>';
                throw new NotImplementedError();
                //Dialog.showPlugCubedCommands(userCommands,modCommands);
            } else {
                //Dialog.showPlugCubedCommands(userCommands);
            }
            return true;
        }
        if (value == '/avail' || value == '/available') {
            API.setStatus(0);
            return true;
        }
        if (value == '/brb' || value == '/away') {
            API.setStatus(1);
            if (plugCubed.settings.autojoin) {
                plugCubed.settings.autojoin = false;
                plugCubed.changeGUIColor('join',false);
                plugCubed.saveSettings();
            }
            return true;
        }
        if (value == '/work' || value == '/working') {
            API.setStatus(2);
            return true;
        }
        if (value == '/sleep' || value == '/sleeping') {
            API.setStatus(3);
            if (plugCubed.settings.autojoin) {
                plugCubed.settings.autojoin = false;
                plugCubed.changeGUIColor('join',false);
                plugCubed.saveSettings();
            }
            return true;
        }
        if (value == '/join')
            return API.djJoin(), true;
        if (value == '/leave')
            return API.djLeave(),true;
        if (value == '/whoami')
            return plugCubed.getUserInfo(API.getSelf().id),true;
        if (value == '/woot')
            return $('#button-vote-positive').click(), true;
        if (value == '/meh')
            return $('#button-vote-negative').click(), true;
        if (value == '/refresh')
            return $('#button-refresh').click(), true;
        if (value == '/version')
            return API.chatLog(this.i18n('running',[plugCubed.version.toString()])), true;
        if (value == '/mute') {
            plugCubed.lastVolume = API.getVolume();
            API.setVolume(0);
            return true;
        }
        if (value == '/link')
            return API.sendChat('plugCubed : http://tatdk.github.io/plugCubed'), true;
        if (value == '/unmute')
            return API.setVolume(plugCubed.lastVolume), true;
        if (value == '/nextsong') {
            var a = API.getNextMedia();
            if (a === undefined) API.chatLog(plugCubed.i18n('noNextSong'));
            else if (a.inHistory)
                API.chatLog(plugCubed.i18n('nextsong',[a.title,a.author])),API.chatLog(plugCubed.i18n('isHistory',[found,plugCubed.history.length]),true);
            else
                API.chatLog(plugCubed.i18n('nextsong',[a.title,a.author]));
        }
        if (value == '/automute') {
            var a = API.getMedia();
            if (a === undefined) return true;
            if (plugCubed.settings.registeredSongs.indexOf(a.id) < 0) {
                plugCubed.settings.registeredSongs.push(a.id);
                plugCubed.settings.autoMuted = true;
                plugCubed.lastVolume = API.getVolume();
                API.setVolume(0);
                API.chatLog(a.title + ' registered to auto-mute on future plays.');
            } else {
                plugCubed.settings.registeredSongs.splice(plugCubed.settings.registeredSongs.indexOf(API.getMedia().id), 1);
                plugCubed.settings.autoMuted = false;
                API.setVolume(plugCubed.lastVolume);
                API.chatLog(a.title + ' removed from automute registry.');
            }
            plugCubed.saveSettings();
            return true;
        }
        if (value == '/alertsoff') {
            if (plugCubed.settings.notify) {
                API.chatLog(plugCubed.i18n('notify.message.disabled'));
                plugCubed.settings.notify = false;
                plugCubed.changeGUIColor('notify',false);
            }
            return true;
        }
        if (value == '/alertson') {
            if (!plugCubed.settings.notify) {
                API.chatLog(plugCubed.i18n('notify.message.enabled'));
                plugCubed.settings.notify = true;
                plugCubed.changeGUIColor('notify',true);
            }
            return true;
        }
        if (value.indexOf('/getpos') === 0) {
            var lookup = plugCubed.getUser(value.substr(8)),
                user = lookup === null ? API.getUser() : lookup,
                spot = API.getWaitListPosition(user.id);
            if (spot != -1)
                API.chatLog(plugCubed.i18n('info.inwaitlist',[spot,API.getWaitList.length]));
            else {
                spot = API.getBoothPosition(user.id);
                if (spot < 0)
                    API.chatLog(plugCubed.i18n('info.notinlist'));
                else if (spot === 0)
                    API.chatLog(plugCubed.i18n('info.userDjing',[user.id === API.getUser().id ? plugCubed.i18n('you') : user.username]));
                else if (spot === 1)
                    API.chatLog(plugCubed.i18n('info.userNextDJ',[user.id === API.getUser().id ? plugCubed.i18n('you') : user.username]));
                else
                    API.chatLog(plugCubed.i18n('info.inbooth',[spot + 1,API.getDJs().length]));
            }
            return true;
        }
        if (value.indexOf('/ignore ') === 0 || value.indexOf('/unignore ') === 0) {
            var user = plugCubed.getUser(value.substr(8));
            if (user === null) return API.chatLog(plugCubed.i18n('error.userNotFound')),true;
            if (user.id === API.getUser().id) return API.chatLog(plugCubed.i18n('error.ignoreSelf')),true;
            if (plugCubed.settings.ignore.indexOf(user.id) > -1) return plugCubed.settings.ignore.splice(plugCubed.settings.ignore.indexOf(user.id),1),plugCubed.saveSettings(),API.chatLog(plugCubed.i18n('ignore.disabled',[user.username])),true;
            return plugCubed.settings.ignore.push(user.id),plugCubed.saveSettings(),API.chatLog(plugCubed.i18n('ignore.enabled',[user.username])),true;
        }
        if (plugCubed.isPlugCubedAdmin(API.getUserid)) {
            if (value.indexOf('/whois ') === 0)
                return plugCubed.getUserInfo(value.substr(7)),true;
        }
        if (API.hasPermission(undefined,API.ROLE.BOUNCER)) {
            if (value.indexOf('/skip') === 0) {
                if (API.getDJs().length < 1) return;
                if (API.getBoothPosition() === 0) {
                    Room.onSkipClick();
                    return true;
                } else {
                    var reason = value.substr(5).trim(),
                        user = plugCubed.getUser(API.getDJs()[0]);
                    if (reason)
                        API.sendChat((user != null ? '@' + user.username + ' - ' : '') + 'Reason for skip: ' + reason);
                    API.moderateForceSkip();
                    return true;
                }
            }
            if (value.indexOf('/whois ') === 0)
                return plugCubed.getUserInfo(value.substr(7)),true;
            if (value.indexOf('/kick ') === 0) {
                if (value.indexOf('::') > 0) {
                    var data = value.substr(6).split(':: ')
                        user = plugCubed.getUser(data[0]);
                        return API.moderateKickUser(user.id,data[1]),true;
                } else
                    return plugCubed.moderation(value.substr(6),'kick'),true;
            }
            if (value.indexOf('/add ') === 0)
                return plugCubed.moderation(value.substr(5),'adddj'),true;
            if (value.indexOf('/remove ') === 0)
                return plugCubed.moderation(value.substr(8),'removedj'),true;
        }
        if (API.hasPermission(undefined,API.ROLE.MANAGER)) {
            if (value === '/lock') {
                API.moderateRoomProps(true,true)
                return true;
            }
            if (value === '/unlock') {
                API.moderateRoomProps(false,true)
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
                $("#user-list-overlay").hide();
                $("#lobby-overlay").hide();
                $("#media-overlay").hide();
                $("#avatar-overlay").hide();
                $("#plugCubedLang-overlay").show();
                $("#overlay-container").show();
                this.draw();
            },
            hide: function() {
                $("#user-list-overlay").hide();
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
                    var button = $("<div/>").addClass("lang-button").css('display','inline-block').css("left", x).data("language", languages[i].file).css("cursor", "pointer").append($("<img/>").attr("src", 'https://rawgithub.com/TATDK/plugCubed/1.7.0-new/flags/flag.' + languages[i].file + '.png').attr('alt',languages[i].name).height(75).width(150));
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

                $.getJSON('https://rawgithub.com/TATDK/plugCubed/1.7.0-new/lang.txt',function(data) { self.languages = data; self.show(); })
                .done(function() { if (self.languages.length === 0) log('<span style="color:#FF0000">Error loading plugCubed</span>'); });
            }
        });
        new a();
    })();
} else var plugCubed = new plugCubedModel();
