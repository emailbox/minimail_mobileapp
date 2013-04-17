var SpeedTest = function() {
  /*
  From:  http://techallica.com/kilo-bytes-per-second-vs-kilo-bits-per-second-kbps-vs-kbps/
  256 kbps            31.3 KBps
  384 kbps            46.9 KBps
  512 kbps            62.5 KBps
  768 kbps            93.8 KBps
  1 mbps ~ 1000kbps   122.1 KBps
  */
};
SpeedTest.prototype = {
  runCount: 3                 // how many times we want to run the test for
  ,imgUrl: "speedtest.jpg"    // Where the image is located at
  ,size: 59917                // bytes
  ,run: function( options ) {
    // console.info('running');
    options = options || {}; // should switch to _.defaults
    this.runCount = options.runCount || this.runCount;
    this.imgUrl = options.imgUrl || this.imgUrl;
    this.size = options.size || this.size;
    
    this.results = []; // reset the results
    this.callback = ( options && options.onEnd ) ? options.onEnd : null;
    this.runTrial(0, options);
  }

  ,runTrial: function(i, options ) {
    var imgUrl = this.imgUrl + "?r=" + Math.random();
    var me = this;
    var testImage = new Image();
    testImage.onload = function() {
      // console.info('onload');
      me.results[i].endTime = ( new Date() ).getTime();
      me.results[i].runTime = me.results[i].endTime - me.results[i].startTime;

      if ( i < me.runCount - 1 )
        me.runTrial( i + 1 ); // run the next trial
      else
      {
        // Execute the callback
        if( me.callback )
          me.callback( me.getResults() );
      }
    };
    this.results[i] = { startTime: ( new Date() ).getTime() };
    testImage.src = imgUrl;
  }

  ,getResults: function() {
    var totalRunTime = 0;
    for( var i = 0; i < this.runCount; i++ )
    {
      if( !this.results || !this.results[i].endTime )
        return null; // exit if we found no endTime.  --> test’s not done yet
      else
        totalRunTime += this.results[i].runTime;
    }

    var avgRunTime = totalRunTime / this.runCount;

    return {
      avgRunTime: avgRunTime
      ,Kbps: ( this.size * 8 / 1024 / ( avgRunTime / 1000 ) )
      ,KBps: ( this.size / 1024 / ( avgRunTime / 1000 ) )
    };
  }
}
