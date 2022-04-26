export class Utils {

    static logplus(n1, n2) {
        if (n1 < n2) return Utils.logplus(n2, n1);
        if (n1 == -Infinity) return -Infinity;
        if (n1-n2 > 16) return n1;
        return n2 + Math.log10(Math.pow(10, n1-n2) + 1);
    }

    static logminus(n1, n2) {
        if (n1 < n2) throw `subtracting small-big is not supported ${n1} ${n2}`;
        if (n1 == -Infinity) return -Infinity;
        if (n1-n2 > 16) return n1;
        return n2 + Math.log10(Math.pow(10, n1-n2) - 1);
    }

    static getLogStepwisePowerSum(level, basePower, stepLength, offset) { 
        const quotient = Math.floor(level / stepLength);
        const remainder = level - quotient * stepLength;

        return Utils.logplus(
            Math.log10(remainder + offset),
            Utils.logminus(Math.log10(basePower) * quotient, 0) + Math.log10(stepLength/(basePower - 1) + remainder)
        )
    }

    static makeVariable(curId, cost) {
        return {
            level: 0,
            curId: curId,
            cost: cost,
            reset() {this.level = 0;}
        }
    }

}