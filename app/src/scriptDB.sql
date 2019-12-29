-- Table: public.vol

-- DROP TABLE public.vol;

CREATE TABLE public.vol
(
    id bigint NOT NULL,
    entree_date timestamp with time zone NOT NULL,
    vol_date timestamp with time zone NOT NULL,
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

-- DROP TABLE public.vol_data;

CREATE TABLE public.vol_data
(
    vol_id bigint NOT NULL,
    data text COLLATE pg_catalog."default" NOT NULL,
    CONSTRAINT vol_data_pkey PRIMARY KEY (vol_id),
    CONSTRAINT "vol_FK" FOREIGN KEY (vol_id)
        REFERENCES public.vol (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
        NOT VALID
)
WITH (
    OIDS = FALSE
)
TABLESPACE pg_default;

ALTER TABLE public.vol_data
    OWNER to postgres;
COMMENT ON TABLE public.vol_data
    IS 'Données analysées pour un vol';