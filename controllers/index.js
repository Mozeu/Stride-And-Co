function home (res,req,next){
    res.render('index',{title: 'Express'});
}

function healthCheck (res,req,next){
    res.status(200).json({
        status: "UP"
    });
}

module.exports = {
    home,healthCheck
}