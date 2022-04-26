import { LogFirstFreeCost, LogExponentialCost } from "../Common/Costs.js"
import { Utils } from "../Common/Utils.js";

const logepsilon = -8;
const log2 = Math.log10(2);
const loge = Math.log10(Math.E);
const log3 = Math.log10(3);

export class T1 {

    static new() {

        let t1 = new T1();

        t1.logCurrency = [-Infinity];

        t1.q1 = Utils.makeVariable(0, new LogFirstFreeCost(new LogExponentialCost(5, Math.log2(2))));
        t1.q2 = Utils.makeVariable(0, new LogExponentialCost(100, Math.log2(10)));
        t1.c1 = Utils.makeVariable(0, new LogExponentialCost(15, Math.log2(2)));
        t1.c2 = Utils.makeVariable(0, new LogExponentialCost(3000, Math.log2(10)));
        t1.c3 = Utils.makeVariable(0, new LogExponentialCost(1e4, 4.5 * Math.log2(10)));
        t1.c4 = Utils.makeVariable(0, new LogExponentialCost(1e10, 8 * Math.log2(10)));
        t1.varlist = ['q1', 'q2', 'c1', 'c2', 'c3', 'c4'];

        t1.logTau = 0;
        t1.logPublicationMultiplier = 0;

        t1.timeResidue = 0;

        t1.resetHelpers();

        return t1;
    }

    clone() {
        let t1 = T1.new();

        t1.logCurrency = [...this.logCurrency];

        ['logTau', 'logPublicationMultiplier', 'rhoN', 'rhoNm1', 'rhoNm2', 'ltickspeed', 'lvc1', 'lvc2', 'lvc3', 'lvc4'].forEach(
            name => t1[name] = this[name]
        )

        t1.varlist.forEach(
            name => t1[name].level = this[name].level
        )

        t1.timeResidue = this.timeResidue;

        return t1;
    }

    buy(varname, quantity) {
        // if (!this.varlist.includes(varname)) throw `unknown var ${varname}`

        const vari = this[varname];

        if (this.logCurrency[vari.curId] < vari.cost.getCost(vari.level)) return false;

        if (quantity < 0) {
            const delta = vari.cost.getMax(vari.level, this.logCurrency[vari.curId]);
            if (delta > 0) {
                const price = vari.cost.getSum(vari.level, vari.level + delta);
                this.logCurrency[vari.curId] = Utils.logminus(this.logCurrency[vari.curId], price);
                vari.level += delta;
            } else throw "something bad"
        } else {
            const price = vari.cost.getSum(vari.level, vari.level + quantity);
            if (this.logCurrency[vari.curId] > price) {
                this.logCurrency[vari.curId] = Utils.logminus(this.logCurrency[vari.curId], price);
                vari.level += quantity;
            } else return false;
        }

        switch(varname){
            case 'q1':
            case 'q2':
                this.ltickspeed = T1.getLogTickspeed(this.q1.level, this.q2.level);
                break;
            case 'c1':
                this.lvc1 = T1.getLogC1(this.c1.level) * 1.15;
                break;
            case 'c2':
                this.lvc2 = T1.getLogC2(this.c2.level);
                break;
            case 'c3':
                this.lvc3 = T1.getLogC3(this.c3.level);
                break;
            case 'c4':
                this.lvc4 = T1.getLogC4(this.c4.level);
                break;
        }

        return true;
    }

    tick(elapsedTime, logmultiplier, logr9) {
        if (this.ltickspeed == -Infinity) return;

        this.timeResidue += elapsedTime;

        const logT = Math.log10(this.timeResidue);

        if (this.ltickspeed < 1 && Utils.logplus(this.ltickspeed + logT, logepsilon) < 0) return;

        const ltickPower = this.ltickspeed + logT + logmultiplier;

        this.rhoNm2 = this.rhoNm1;
        this.rhoNm1 = this.rhoN;
        this.rhoN = this.logCurrency[0];

        const bonus = this.logPublicationMultiplier + logr9;
        const term1 = Math.log10(Math.max(this.rhoN, 0) / loge / 100 + 1) + this.lvc1 + this.lvc2;
        const term2 = this.rhoNm1 * 0.2 + this.lvc3;
        const term3 = this.rhoNm2 * 0.3 + this.lvc4;

        this.logCurrency[0] = Utils.logplus(this.rhoN, Utils.logplus(Utils.logplus(term1, term2), term3) + ltickPower + bonus);

        this.logTau = Math.max(this.logTau, this.logCurrency[0]);

        this.timeResidue = 0;

        return;
    }

    getRatio() {
        return T1.getLogPublicationMultiplier(this.logTau) - this.logPublicationMultiplier;
    }

    publish() {
        const newpub = T1.getLogPublicationMultiplier(this.logTau);
        if (newpub <= this.logPublicationMultiplier) return;
        this.resetHelpers();
        this.logPublicationMultiplier = newpub;
    }

    resetHelpers() {
        this.varlist.forEach(varname => this[varname].reset());
        this.logCurrency[0] = -Infinity;
        this.rhoN = -Infinity;
        this.rhoNm1 = -Infinity;
        this.rhoNm2 = -Infinity;

        this.ltickspeed = T1.getLogTickspeed(this.q1.level, this.q2.level);
        this.lvc1 = T1.getLogC1(this.c1.level) * 1.15;
        this.lvc2 = T1.getLogC2(this.c2.level);
        this.lvc3 = T1.getLogC3(this.c3.level);
        this.lvc4 = T1.getLogC4(this.c4.level);

        this.timeResidue = 0;
    }

    static getLogPublicationMultiplier(logtau) { return 0.164 * logtau - log3; }
    static getLogQ1(level) { return Utils.getLogStepwisePowerSum(level, 2, 10, 0); }
    static getLogQ2(level) { return level * log2; }
    static getLogC1(level) { return Utils.getLogStepwisePowerSum(level, 2, 10, 1); }
    static getC1Exponent(level) { return 1 + 0.05 * level; }
    static getLogC2(level) { return level * log2; }
    static getLogC3(level) { return level; }
    static getLogC4(level) { return level; }
    static getLogTickspeed(q1level, q2level) { return T1.getLogQ1(q1level) + T1.getLogQ2(q2level); }

}