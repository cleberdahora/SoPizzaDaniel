(function() {
  'use strict';

  function PlaceCtrl($state, lodash, Restangular, place, geolocation) {
    let self = this;

    //place.dishes = [
      //{
        //picture: {
          //prefix: 'https://irs2.4sqi.net/img/general/',
          //suffix: '/fPdzDsa9qmcPd0EWrlkf2kT1rAawCA5py1A4uHLdqfQ.jpg'
        //},
        //name: 'Americana',
        //pricing: [
          //{
            //type: 'Pequena',
            //price: 50.00
          //},
          //{
            //type: 'Grande',
            //price: 100.00
          //}
        //],
        //ingredients: [
          //'molho',
          //'mussarela',
          //'bacon',
          //'milho',
          //'ovos',
          //'orégano',
        //]
      //},
      //{
        //picture: {
          //prefix: 'https://irs2.4sqi.net/img/general/',
          //suffix: '/fPdzDsa9qmcPd0EWrlkf2kT1rAawCA5py1A4uHLdqfQ.jpg'
        //},
        //name: 'Calabresa com Catupiry',
        //pricing: 35.00,
        //ingredients: [
          //'molho',
          //'mussarela',
          //'calabresa',
          //'catupiry',
          //'orégano'
        //]
      //},
      //{
        //picture: {
          //prefix: 'https://irs2.4sqi.net/img/general/',
          //suffix: '/fPdzDsa9qmcPd0EWrlkf2kT1rAawCA5py1A4uHLdqfQ.jpg'
        //},
        //name: 'Frango com Catupiry',
        //pricing: 35.00,
        //ingredients: [
          //'molho',
          //'mussarela',
          //'frango',
          //'catupiry',
          //'orégano'
        //]
      //},
      //{
        //picture: {
          //prefix: 'https://irs2.4sqi.net/img/general/',
          //suffix: '/fPdzDsa9qmcPd0EWrlkf2kT1rAawCA5py1A4uHLdqfQ.jpg'
        //},
        //name: 'Quatro Queijos',
        //pricing: 35.00,
        //ingredients: [
          //'molho',
          //'mussarela',
          //'provolone',
          //'parmesão',
          //'catupiry',
          //'orégano'
        //]
      //},
      //{
        //picture: {
          //prefix: 'https://irs2.4sqi.net/img/general/',
          //suffix: '/fPdzDsa9qmcPd0EWrlkf2kT1rAawCA5py1A4uHLdqfQ.jpg'
        //},
        //name: 'Siciliana',
        //pricing: 35.00,
        //ingredients: [
          //'molho',
          //'mussarela',
          //'champignon',
          //'bacon',
          //'pimentão',
          //'azeiton',
          //'orégano'
        //]
      //}
    //];

    self.place = place;
  }

  angular.module('app')
    .controller('PlaceCtrl', PlaceCtrl);
})();
