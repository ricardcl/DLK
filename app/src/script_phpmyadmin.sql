/**Creation user 1*/
CREATE USER 'serveur_dlk'@'%' IDENTIFIED VIA mysql_native_password USING '***';GRANT USAGE ON *.* TO 'serveur_dlk'@'%' REQUIRE NONE WITH MAX_QUERIES_PER_HOUR 0 MAX_CONNECTIONS_PER_HOUR 0 MAX_UPDATES_PER_HOUR 0 MAX_USER_CONNECTIONS 0;


/**Creation user V2*/
CREATE USER 'serveur_dlk'@'localhost' IDENTIFIED VIA mysql_native_password USING '***';GRANT ALL PRIVILEGES ON *.* TO 'serveur_dlk'@'localhost' REQUIRE NONE WITH GRANT OPTION MAX_QUERIES_PER_HOUR 0 MAX_CONNECTIONS_PER_HOUR 0 MAX_UPDATES_PER_HOUR 0 MAX_USER_CONNECTIONS 0;CREATE DATABASE IF NOT EXISTS `serveur_dlk`;GRANT ALL PRIVILEGES ON `serveur\_dlk`.* TO 'serveur_dlk'@'localhost';


/** Création contrainte entre les deux tables*/
ALTER TABLE `vol_data` ADD CONSTRAINT `vol_FK` FOREIGN KEY (`vol_id`) REFERENCES `vol`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;