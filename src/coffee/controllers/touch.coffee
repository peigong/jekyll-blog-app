define [
    'jquery'
    'swiper'
], ($, Swiper) ->
    swiper = null
    isTouch = () ->
        $('body').width() < 641
    class Touch
        constructor: () ->
            $ () ->
                if isTouch()
                    swiper = new Swiper '.swiper-container'
                    $ 'body'
                    .swipeLeft () ->
                        swiper.slideNext()
                    $ 'body'
                    .swipeRight () ->
                        swiper.slidePrev()
        toPost: ()->
            if isTouch()
                swiper.slideTo 0
        toList: ()->
            if isTouch()
                swiper.slideTo 1
    return new Touch