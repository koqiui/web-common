/**
 * Created by koqiui on 2017-04-08.
 */
import Lo from 'lodash'

const moduleName = 'Utils';
//

export class StringBuilder {
    constructor(...args) {
        this.value = '';
        //
        this.append.apply(this, args);
    }

    append(...args) {
        for (let i = 0, c = args.length; i < c; i++) {
            this.value = this.value + args[i];
        }
    }

    appendln(...args) {
        this.append.apply(this, args);
        this.append('\n');
    }

    prepend(...args) {
        for (let i = 0, c = args.length; i < c; i++) {
            this.value = args[i] + this.value;
        }
    }

    clear() {
        this.value = '';
    }

    toString() {
        return this.value;
    }
}

Object.assign(String, {
    builder: function (...args) {
        let ret = new StringBuilder();
        ret.append.apply(ret, args);
        return ret;
    }
});

export default  {
    moduleName,
    //
    StringBuilder
}