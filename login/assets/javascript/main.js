/*jshint esversion: 6 */
/*jshint esversion: 6 */

let counts = 0;

(function ($) {
    'use strict';

    const mainSectionElements1 = $('.text-effect');
    const mainSectionElements2 = $('.form-container');
    const boxObject = $('.box-object');
    var animatedElement = document.querySelector('.box-object-inner-border');
    const texteffect = document.querySelector(".text-effect");

    window.onload = function() {
        animateElements();
    }

    function animateElements() {

        document.getElementById('loadingOverlay').style.opacity = '0';

        animatedElement.classList.add('border-animation');
        texteffect.style.display = 'block';

        setTimeout(() => {
            boxObject.addClass('box-to-romb');
            document.getElementById('loadingOverlay').style.display = 'none';
        }, 3000);

        setTimeout(() => {
            boxObject.addClass('box-to-romb-final');
        }, 6000);

        setTimeout(() => {
            mainSectionElements2.removeClass('hide-effect');
            mainSectionElements2.addClass('show-effect');

            const particle = document.getElementById('particles-js');
            particle.style.display = 'block';

        }, 7000);

        $(".text-animation-phrases > h2").lettering('words').children("span").lettering().children("span").lettering();

        var spanDelay = 3;

        for (var i = 2, l = $('.text-animation-phrases h2').length; i < l; i++) {
            $(`.text-animation-phrases h2:nth-child(${i}) > span > span > span`).css({
                '-webkit-animation-delay': `${spanDelay}s`,
                '-moz-animation-delay': `${spanDelay}s`,
                'animation-delay': `${spanDelay}s`,
            });
            spanDelay += 4;
        }

        $(`.text-animation-phrases h2:nth-child(${$('.text-animation-phrases h2').length}) > span > span > span`).css({
            '-webkit-animation': `FadeIn 2s linear ${spanDelay}s forwards`,
            '-moz-animation': `FadeIn 2s linear ${spanDelay}s forwards`,
            'animation': `FadeIn 2s linear ${spanDelay}s forwards`,
        });

        if ($(window).width() <= 768) {
            $(".text-animation-phrases h2").each(function(index) {
                const h2Split = $(this).text().split(" ");
                h2Split.pop();

                if (h2Split.length === 3) {
                    $(this).find('> span:nth-child(1)').css('margin-top', '-40px');
                    $(this).find('> span:nth-child(2)').css('margin-top', '0px');
                    $(this).find('> span:nth-child(3)').css('margin-top', '40px');
                }

                if (h2Split.length === 2) {
                    $(this).find('> span:nth-child(1)').css('margin-top', '-30px');
                    $(this).find('> span:nth-child(2)').css('margin-top', '30px');
                }
            });
        }
    }

}(jQuery));




var particleConfig = {
    "particles": {
        "number": {
            "value": 104,
                "density": {
                "enable": true,
                    "value_area": 1499.3805191013182
            }
        },
        "color": {
            "value": "#00d1ff"
        },
        "shape": {
            "type": "circle",
                "stroke": {
                "width": 3,
                    "color": "#00b3ff"
            },
            "polygon": {
                "nb_sides": 5
            },
            "image": {
                "src": "img/github.svg",
                    "width": 100,
                    "height": 100
            }
        },
        "opacity": {
            "value": 0.3551164387345227,
                "random": false,
                "anim": {
                "enable": false,
                    "speed": 1,
                    "opacity_min": 0.1,
                    "sync": false
            }
        },
        "size": {
            "value": 3,
                "random": true,
                "anim": {
                "enable": true,
                    "speed": 1,
                    "size_min": 1,
                    "sync": false
            }
        },
        "line_linked": {
            "enable": true,
                "distance": 120,
                "color": "#16ffba",
                "opacity": 0.49716301422833176,
                "width": 1
        },
        "move": {
            "enable": true,
                "speed": 2.5,
                "direction": "none",
                "random": true,
                "straight": false,
                "out_mode": "bounce",
                "bounce": false,
                "attract": {
                "enable": false,
                    "rotateX": 600,
                    "rotateY": 1200
            }
        }
    },
    "interactivity": {
        "detect_on": "canvas",
            "events": {
            "onhover": {
                "enable": true,
                    "mode": "repulse"
            },
            "onclick": {
                "enable": true,
                    "mode": "push"
            },
            "resize": true
        },
        "modes": {
            "grab": {
                "distance": 400,
                    "line_linked": {
                    "opacity": 1
                }
            },
            "bubble": {
                "distance": 400,
                    "size": 40,
                    "duration": 2,
                    "opacity": 8,
                    "speed": 3
            },
            "repulse": {
                "distance": 150,
                    "duration": 0.4
            },
            "push": {
                "particles_nb": 4
            },
            "remove": {
                "particles_nb": 2
            }
        }
    },
    "retina_detect": false
};

particlesJS("particles-js", particleConfig);

let countParticles;
let update;

countParticles = document.querySelector('.js-count-particles');

update = () => {
    requestAnimationFrame(update);
};

requestAnimationFrame(update);

function togglePlay() {
    let myAudio = document.getElementById("myAudio");
    if (myAudio.paused) {
        myAudio.play();
        document.getElementById("musikbild").src = "assets/img/musikan.png";
    } else {
        myAudio.pause();
        document.getElementById("musikbild").src = "assets/img/musikaus.png";
    }
}

function musicPlay() {
    let audio = document.getElementById('myAudio');
    audio.play();
    document.removeEventListener('click', musicPlay);
}

document.addEventListener('click', musicPlay);

window.addEventListener('DOMContentLoaded', () => {
    let video = document.getElementById('playvideo');
    video.volume = 0;
});