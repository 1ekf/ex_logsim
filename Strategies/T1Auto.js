import { Utils } from "../Common/Utils.js"

export class T1Auto {

    constructor(t1) {
        this.t1 = t1;
        this.pLogCurrency = undefined;
        this.costs = {};
        t1.varlist.forEach(name => {
            const vari = t1[name];
            this.costs[name] = vari.cost.getCost(vari.level)
        });
    }

    updateMincost() {

        const mincost = {};

        this.t1.varlist.forEach(name => {
            const cost = this.costs[name];
            const curId = this.t1[name].curId;
            if (mincost[curId] === undefined || mincost[curId] > cost) {
                mincost[curId] = cost;
            }
        })

        this.mincost = mincost;
    }

    buy() { // returns whether a purchase was made
        let bought = false;
        for (let name of this.t1.varlist) {
            const vari = this.t1[name]
            if (this.t1.buy(name, -1)) {
                this.costs[name] = vari.cost.getCost(vari.level);
                bought = true;
            }
        }

        if (bought) {
            this.updateMincost();
            this.pLogCurrency = undefined;
        }

        return bought;
    }

    timeRequest(prevStep) {
        if (this.pLogCurrency === undefined) return 0.1;

        const deltas = this.t1.logCurrency.map(
            (lcur, i) => {
                const pcur = this.pLogCurrency[i];
                return lcur > pcur ? Utils.logminus(lcur, pcur) : -Infinity;
            }
        );

        if (deltas.every(delta => delta == -Infinity)) return 0.1;

        const needs = this.t1.logCurrency.map(
            (lcur, i) => {
                const mc = this.mincost[i];
                if (mc < lcur) throw "something isn't bought"
                return Utils.logminus(mc, lcur);
            }
        );
        
        const newSteps = needs.map((need, i) => {
            return Math.pow(10, need - deltas[i]);
        })
        
        return Math.min(10, Math.max(Math.min(...newSteps) * prevStep / 10, 0.1));

    }

    tick(stepSize, logmultiplier, logr9) {
        this.pLogCurrency = [...this.t1.logCurrency];
        this.t1.tick(stepSize, logmultiplier, logr9);
    }

}