# covid-19
A symfony based covid-19 analysis tool

This tool use the following repository as data source
https://github.com/CSSEGISandData/COVID-19
Please have a closer look at the this repository for limitations of the further use of this data!
_"This GitHub repo and its contents herein, including all data, mapping, and analysis, copyright 2020 Johns Hopkins University, all rights reserved, is provided to the public strictly for educational and academic research purposes."_

//#COVID2019
//#CodeVsCovid19

## get it running

#### requirements
I developed this app with:
* php >= 7.2
* mysql/mariadb
* composer
* yarn

#### your will need to
* Create a new file **config/parameter_prod.yaml** (change the admin password and your database connection)
* import the database dump from **data/db/covid_dump_ed.sql.gz**
* check if there is a fitting **public/.htacces.ENV** for your needs or create a fitting **public/.htacces**

#### finally run in project directory shell
* _composer install_ or _composer update_
* _yarn encore prod_ or _yarn encore dev_ corresponding to your needs
* pray that the app is running now


