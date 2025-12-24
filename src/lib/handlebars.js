const timeago = require('timeago.js');
const moment = require('moment');
// const timeagoInstance = timeago();
// const _ = require("underscore");

const helpers = {};

helpers.timeago = (savedTimestamp) => {
    return null;
    return timeagoInstance.format(savedTimestamp);
};

helpers.twelveHourFormat = (time) => {
    return moment(time, ["HH:mm:ss"]).format("h:mm A");
};

helpers.humanReadableDate = (time) => {
    if(time) {
        return moment(time, ["YYYY-MM-DD HH:mm:ss"]).format('MMM Do, YYYY');
    }
};

helpers.getValue = (errors, param, original_value) => {
    if (errors !== null) {
        for (let error of errors) {
            if (error.param == param) {
                return error.value
            }
        }
    }
    return original_value;
};

helpers.decorateErrors = (varName, errors, options) => {
    let res = {}
    if (errors !== null) {
        for (let error of errors) {
            res[error.param] = { "msg": error.msg, "value": error.value }
        }
    }
    options.data.root[varName] = res;
};

helpers.check = (condition, ifdata, elsedata) => {
    if (condition) {
        return ifdata;
    } else {
        return elsedata;
    }
};

helpers.isInValid = (param, errors) => {
    if(typeof errors !== 'undefined') {
        if (param in errors) {
            return 'is-invalid'
        } else {
            return ""
        }
    }
};

helpers.errMsg = (param, errors) => {
    if(typeof errors !== 'undefined') {
        if (param in errors) {
            return errors[param].msg
        }
    }
};

helpers.populateValue = (param, param_data = null, form_data, errors) => {
    if (typeof errors !== 'undefined') {
        if (param in errors) {
            return errors[param].value
        } else {
            if(form_data !== null) {
                return param in form_data ? form_data[param] : ""
            } else {
                return ""
            }
        }
    } else {
        return param_data == null ? "" : param_data
    }
};

helpers.populateAddValue = (param, form_data, errors) => {
   if(form_data !== null) {
        return form_data[param]
   } else {
       return "";
   }
};


helpers.checkKeyExist = (key, obj) => {
    // obj = JSON.parse(obj)
    if (obj !== null) {
        if (key in obj)
            return true
    }
    return false
};

helpers.inc = (value, start_index) => {
    return parseInt(value) + parseInt(start_index) + 1;
};

helpers.math = (lvalue, operator, rvalue) => {
    lvalue = parseFloat(lvalue);
    rvalue = parseInt(rvalue);
    return lvalue + rvalue;

    return {
        "+": lvalue + rvalue,
        "-": lvalue - rvalue,
        "*": lvalue * rvalue,
        "/": lvalue / rvalue,
        "%": lvalue % rvalue
    }[operator];
};

helpers.times = (n, block) => {
    var accum = '';
    for(var i = 1; i <= n; ++i)
        accum += block.fn(i);
    return accum;
};

helpers.if_eq = (a, b, opts) => {
    if (a == b) {
        return opts.fn(this);
    } else {
        return opts.inverse(this);
    }
};

helpers.if_gt = (a, b, opts) => {
    if (a > b) {
        return opts.fn(this);
    } else {
        return opts.inverse(this);
    }
};

helpers.if_lt = (a, b, opts) => {
    if (a < b) {
        return opts.fn(this);
    } else {
        return opts.inverse(this);
    }
};

helpers.pagination_item = (total_page, cur_page, offset, search, route) => {
    let item = '';
    let prev_disabled = (cur_page <= 1) ? "disabled" : "";
    let prev_href = parseInt(cur_page - 1);
    let route_last_part = "";
    if(search == null) {
        search = "";
    }
    item += `<li class="page-item ${prev_disabled}"><a class="page-link " href="/${route}/${prev_href}/${offset}/${search}" tabindex="-1">Previous</a></li>`;
    for(i = 1; i <= total_page; i++) {
        let active = (i == cur_page) ? "active" : "";
        item += `<li class="page-item ${active}"><a class="page-link" href="/${route}/${i}/${offset}/${search}">${i}</a></li>`;
    }
    let next_disabled = cur_page >= total_page ? "disabled" : "";
    let next_href = parseInt(cur_page) + 1;
    item += `<li class="page-item ${next_disabled}"><a class="page-link" href="/${route}/${next_href}/${offset}/${search}">Next</a></li>`;
    return item;
};

helpers.toJson = (object) => {
    return JSON.stringify(object);
};

helpers.checkSelected = (option_val, val) => {
    if(Array.isArray(val)) {
        for(let i = 0; i < val.length; i++) {
            if (option_val == parseInt(val[i])) {
                return "selected";
            }
        }
    } else {
        if(option_val == val) {
            return "selected";
        } else {
            return "";
        }
    }
};

helpers.setVar = (varName, varValue, options) => {
    options.data.root[varName] = varValue;

    // usage: 
    // {{setVar "greeting" "Hello World!"}}
    //         <div>
    //             <h1>{{@root.greeting}}</h1>
    //         </div>
};
module.exports = helpers;