<?php

namespace App\Entity;

use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;

/**
 * @ORM\Entity(repositoryClass="App\Repository\CountryRepository")
 */
class Country
{
    /**
     * @ORM\Id()
     * @ORM\GeneratedValue()
     * @ORM\Column(type="integer")
     */
    private $id;

    /**
     * @ORM\Column(type="string", length=255)
     */
    private $name;

    /**
     * @ORM\ManyToOne(targetEntity="App\Entity\Continent", inversedBy="countries")
     */
    private $continent;

    /**
     * @ORM\OneToMany(targetEntity="App\Entity\CoronaStats", mappedBy="country", orphanRemoval=true)
     */
    private $coronaStats;

    /**
     * @ORM\Column(type="string", length=255)
     */
    private $iso2;

    /**
     * @ORM\Column(type="string", length=255)
     */
    private $capital;

    /**
     * @ORM\Column(type="decimal", precision=27, scale=20)
     */
    private $latitude;

    /**
     * @ORM\Column(type="decimal", precision=27, scale=20)
     */
    private $longitude;

    /**
     * @ORM\Column(type="integer")
     */
    private $population;

    /**
     * @ORM\OneToMany(targetEntity="App\Entity\City", mappedBy="country")
     */
    private $cities;

    public function __construct()
    {
        $this->coronaStats = new ArrayCollection();
        $this->cities = new ArrayCollection();
    }

    /**
     * @return mixed
     */
    public function getIso2()
    {
        return $this->iso2;
    }

    /**
     * @param mixed $iso2
     *
     * @return Country
     */
    public function setIso2($iso2) : Country
    {
        $this->iso2 = $iso2;

        return $this;
    }

    /**
     * @return mixed
     */
    public function getCapital()
    {
        return $this->capital;
    }

    /**
     * @param mixed $capital
     *
     * @return Country
     */
    public function setCapital($capital) : Country
    {
        $this->capital = $capital;

        return $this;
    }

    /**
     * @return mixed
     */
    public function getLatitude()
    {
        return $this->latitude;
    }

    /**
     * @param mixed $latitude
     *
     * @return Country
     */
    public function setLatitude($latitude) : Country
    {
        $this->latitude = $latitude;

        return $this;
    }

    /**
     * @return mixed
     */
    public function getLongitude()
    {
        return $this->longitude;
    }

    /**
     * @param mixed $longitude
     *
     * @return Country
     */
    public function setLongitude($longitude) : Country
    {
        $this->longitude = $longitude;

        return $this;
    }

    /**
     * @return mixed
     */
    public function getPopulation()
    {
        return $this->population;
    }

    /**
     * @param mixed $population
     *
     * @return Country
     */
    public function setPopulation($population) : Country
    {
        $this->population = $population;

        return $this;
    }

    public function __toString()
    {
        return $this->name;
    }

    public function getId() : ?int
    {
        return $this->id;
    }

    public function getName() : ?string
    {
        return $this->name;
    }

    public function setName(string $name) : self
    {
        $this->name = $name;

        return $this;
    }

    public function getContinent() : ?Continent
    {
        return $this->continent;
    }

    public function setContinent(?Continent $continent) : self
    {
        $this->continent = $continent;

        return $this;
    }

    /**
     * @return Collection|CoronaStats[]
     */
    public function getCoronaStats() : Collection
    {
        return $this->coronaStats;
    }

    public function addCoronaStat(CoronaStats $coronaStat) : self
    {
        if (!$this->coronaStats->contains($coronaStat))
        {
            $this->coronaStats[] = $coronaStat;
            $coronaStat->setCountry($this);
        }

        return $this;
    }

    public function removeCoronaStat(CoronaStats $coronaStat) : self
    {
        if ($this->coronaStats->contains($coronaStat))
        {
            $this->coronaStats->removeElement($coronaStat);
            // set the owning side to null (unless already changed)
            if ($coronaStat->getCountry() === $this)
            {
                $coronaStat->setCountry(null);
            }
        }

        return $this;
    }

    /**
     * @return Collection|City[]
     */
    public function getCities(): Collection
    {
        return $this->cities;
    }

    public function addCity(City $city): self
    {
        if (!$this->cities->contains($city)) {
            $this->cities[] = $city;
            $city->setCountry($this);
        }

        return $this;
    }

    public function removeCity(City $city): self
    {
        if ($this->cities->contains($city)) {
            $this->cities->removeElement($city);
            // set the owning side to null (unless already changed)
            if ($city->getCountry() === $this) {
                $city->setCountry(null);
            }
        }

        return $this;
    }
}
