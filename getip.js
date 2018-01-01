var os = require('os');
var ifaces = os.networkInterfaces();
module.exports = function () {
    const ret=[];
    Object.keys(ifaces).forEach(function (ifname) {
        var alias = 0;

        ifaces[ifname].forEach(function (iface) {
            if ('IPv4' !== iface.family || iface.internal !== false) {
                // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
                return;
            }

            ret.push(iface.address);
        });
    });
    return ret;
}
