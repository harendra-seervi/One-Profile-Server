const success = (statusCode, result) => {
    return {
        "status": "ok",
        statusCode,
        result
    }
};


const error = (statusCode, error) => {
    return {
        "status": "error",
        statusCode,
        error
    }
};


module.exports = { success, error };