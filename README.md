### Что это

Анимированный эффект как в airDrop из IOS17. 

#### Видео реальной ios анимации

[https://www.youtube.com/watch?v=sTvLdtYjbkE](https://www.youtube.com/watch?v=sTvLdtYjbkE)

#### Демонстрация библиотеки

……

### Установка

`npm install --save airdrop_animation`

```javascript
import 'airDrop' from 'airdrop_animation'
function someEvent(){
	airDrop(settings) // fire animation with custom settings
	//or
	airDrop() // fire animation with default settings or after another calls
}
```

### Устройство

Создаётся “скриншот” страницы и на нём проигрывается анимация. [html2canvas](https://www.npmjs.com/package/html2canvas) отправляет страницу на canvas, это изображение передаётся как текстура в webgl. Применяются эффекты stretch, после половины анимации - bang, blur, и 2 blob.

Есть настройки анимации и jsDoc для них. Стандартные:

```javascript
const settings = {
  // элемент, которого будет сделан скриншот
  // высота и ширина должна быть как у window!
	frameElementSelector: '#content',
	performance: {
		blur: { // устанавливаются в шейдере единожды при первом вызове airDrop()
			directions: '13.0', // кол-во направлений для радиального размытия. должно быть строкой из float
			quality: '4.0', // должно быть строкой из float
		},
		maxPixelRatio: Infinity, // ограничение window.devicePixelRatio
	},
}
```

### Ограничения

1.  Статичность. Анимация проигрывается на скриншоте, поэтому изменения страницы не будут видны в это время. 
2.  Несовершенство [html2canvas](https://www.npmjs.com/package/html2canvas). Иногда заметны различия между реальной страницей и “скриншотом”. Пока заметил только отсутствие поддержки paint worklet.  
    При очень большом количестве потомков `settings.frameElementSelector` “скриншот” может создаваться медленно.

### Источник

[Этот metal шейдер](https://gist.github.com/dkun7944/2f793643e469029fb4e7d700f0645ffc) был переписан под glsl и немного изменён чтобы, на мой взгляд, больше быть похожим на оригинал
