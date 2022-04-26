import { Utils } from "./Utils.js"

const log2 = Math.log10(2)

export class LogFirstFreeCost {
    constructor(costModel) {
        this.getCost = level => (level ? costModel.getCost(level - 1) : -Infinity);
        this.getSum = (fromLevel, toLevel) => (toLevel > 0 ? costModel.getSum(fromLevel > 0 ? fromLevel-1 : 0, toLevel-1) : -Infinity);
        this.getMax = (fromLevel, currency) => (fromLevel > 0 ? costModel.getMax(fromLevel-1, currency) : 1+costModel.getMax(0, currency));
    }
}

export class LogConstantCost {
    constructor(cost) {
        const logcost = Math.log10(cost);
        this.getCost = level => logcost;
        this.getSum = (fromLevel, toLevel) => logcost + Math.log10(toLevel - fromLevel);
        this.getMax = (fromLevel, logcurrency) => Math.floor(Math.pow(10, logcurrency - logcost));
    }
}

export class LogLinearCost {
    constructor(initialCost, progress) {

        const logcost = Math.log10(initialCost);

        this.getCost = level => Math.log10(progress * level + initialCost);
        this.getSum = (fromLevel, toLevel) => Math.log10(progress * (fromLevel + toLevel - 1) / 2 + initialCost) + Math.log10(toLevel - fromLevel);
        this.getMax = (fromLevel, logcurrency) => {
            const currency = Math.pow(10, logcurrency);
            const basis = 0.5 - fromLevel - initialCost/progress;
            return Math.floor(basis + Math.sqrt(2*currency/progress + basis * basis))
        };
    }
}

export class LogExponentialCost {
    constructor(initialCost, progress) {

        const logcost = Math.log10(initialCost)

        this.getCost = level => logcost + progress * level * log2;
        this.getSum = (fromLevel, toLevel) => {
            const twoprogress = progress * log2;
            const price0 = twoprogress * fromLevel;
            const price1 = twoprogress * toLevel;
            return Utils.logminus(price1, price0) - Utils.logminus(twoprogress, 0) + logcost;
        }
        this.getMax = (fromLevel, logcurrency) => {
            const twoprogress = progress * log2
            const term1 = Utils.logminus(twoprogress, 0) + logcurrency - logcost;
            const term2 = twoprogress * fromLevel;
            return Math.floor(Utils.logplus(term1, term2) / log2 / progress - fromLevel);
        }
    }
}