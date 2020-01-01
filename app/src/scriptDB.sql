/**
-- Database: Bdd_vols_datalink

-- DROP DATABASE "Bdd_vols_datalink";

CREATE DATABASE "Bdd_vols_datalink"
    WITH 
    OWNER = postgres
    ENCODING = 'UTF8'
    LC_COLLATE = 'French_France.1252'
    LC_CTYPE = 'French_France.1252'
    TABLESPACE = pg_default
    CONNECTION LIMIT = -1;

COMMENT ON DATABASE "Bdd_vols_datalink"
    IS 'Sauvegarde des vols analysés via l''outil Datalink Hors-Ligne';
*
*/


DROP TABLE public.vol_data;
DROP TABLE public.vol;

-- Table: public.vol


CREATE TABLE public.vol
(
    id integer NOT NULL DEFAULT nextval('vol_id_seq'::regclass),
    entree_date character varying COLLATE pg_catalog."default" NOT NULL,
    vol_date character varying COLLATE pg_catalog."default" NOT NULL,
    plnid character varying COLLATE pg_catalog."default",
    arcid character varying COLLATE pg_catalog."default",
    CONSTRAINT vol_pkey PRIMARY KEY (id)
)
WITH (
    OIDS = FALSE
)
TABLESPACE pg_default;

ALTER TABLE public.vol
    OWNER to postgres;


-- Table: public.vol_data


CREATE TABLE public.vol_data
(
    vol_id integer NOT NULL,
    data text COLLATE pg_catalog."default" NOT NULL,
    CONSTRAINT vol_data_pkey PRIMARY KEY (vol_id),
    CONSTRAINT "vol_FK" FOREIGN KEY (vol_id)
        REFERENCES public.vol (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
)
WITH (
    OIDS = FALSE
)
TABLESPACE pg_default;

ALTER TABLE public.vol_data
    OWNER to postgres;
COMMENT ON TABLE public.vol_data
    IS 'Données analysées pour un vol';