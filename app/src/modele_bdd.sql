-- Pour récupérer le modele 
-- clic sur la bdd > exporter 
-- format SQL
-- clic sur executer

-- phpMyAdmin SQL Dump
-- version 4.8.4
-- https://www.phpmyadmin.net/
--
-- Hôte : 127.0.0.1
-- Généré le :  jeu. 23 jan. 2020 à 13:39
-- Version du serveur :  10.1.37-MariaDB
-- Version de PHP :  5.6.40

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de données :  `bdd_vols_datalink`
--

-- --------------------------------------------------------

--
-- Structure de la table `vol`
--

CREATE TABLE `vol` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `entree_date` varchar(255) DEFAULT NULL,
  `vol_date` varchar(255) DEFAULT NULL,
  `plnid` varchar(255) DEFAULT NULL,
  `arcid` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Déchargement des données de la table `vol`
--

INSERT INTO `vol` (`id`, `entree_date`, `vol_date`, `plnid`, `arcid`) VALUES
(1, 'value-2', 'value-3', 'value-4', 'value-5'),
(2, 'value-2', 'value-3', 'value-4', 'value-5'),
(3, 'value-2', 'value-3', 'value-4', 'value-5');

-- --------------------------------------------------------

--
-- Structure de la table `vol_data`
--

CREATE TABLE `vol_data` (
  `vol_id` bigint(20) UNSIGNED NOT NULL,
  `data` text
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Index pour les tables déchargées
--

--
-- Index pour la table `vol`
--
ALTER TABLE `vol`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `id` (`id`);

--
-- Index pour la table `vol_data`
--
ALTER TABLE `vol_data`
  ADD PRIMARY KEY (`vol_id`),
  ADD UNIQUE KEY `vol_id` (`vol_id`);

--
-- AUTO_INCREMENT pour les tables déchargées
--

--
-- AUTO_INCREMENT pour la table `vol`
--
ALTER TABLE `vol`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT pour la table `vol_data`
--
ALTER TABLE `vol_data`
  MODIFY `vol_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- Contraintes pour les tables déchargées
--

--
-- Contraintes pour la table `vol_data`
--
ALTER TABLE `vol_data`
  ADD CONSTRAINT `vol_FK` FOREIGN KEY (`vol_id`) REFERENCES `vol` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;