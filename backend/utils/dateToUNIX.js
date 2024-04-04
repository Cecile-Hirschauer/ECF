const dateToUNIX = (date) => {
    return Math.round(new Date(date).getTime() / 1000).toString()
}

module.exports = dateToUNIX;