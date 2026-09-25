
function home (req, res, next) {
  res.render('index', { title: 'Express' });
}

function healthCheck(req, res) {
res.status(200).json({
status: 'UP'
});
}

module.exports = {
    home,healthCheck
}