<?php

namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;

/**
 * @ORM\Entity(repositoryClass="App\Repository\CoronaStatsRepository")
 */
class CoronaStats
{
    /**
     * @ORM\Id()
     * @ORM\GeneratedValue()
     * @ORM\Column(type="integer")
     */
    private $id;

    /**
     * @ORM\Column(type="integer")
     */
    private $amount;

    /**
     * @ORM\Column(type="datetime")
     */
    private $date;

    /**
     * @ORM\Column(type="integer", nullable=true)
     */
    private $amountHealed;

    /**
     * @ORM\Column(type="integer", nullable=true)
     */
    private $amountDeath;

    /**
     * @ORM\ManyToOne(targetEntity="App\Entity\Country", inversedBy="coronaStats")
     * @ORM\JoinColumn(nullable=false)
     */
    private $country;

    private $coronaStatYesterday;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getAmount(): ?int
    {
        return $this->amount;
    }

    public function setAmount(int $amount): self
    {
        $this->amount = $amount;

        return $this;
    }

    public function getDate(): ?\DateTimeInterface
    {
        return $this->date;
    }

    public function setDate(\DateTimeInterface $date): self
    {
        $this->date = $date;

        return $this;
    }

    public function getAmountHealed(): ?int
    {
        return $this->amountHealed;
    }

    public function setAmountHealed(?int $amountHealed): self
    {
        $this->amountHealed = $amountHealed;

        return $this;
    }

    public function getAmountDeath(): ?int
    {
        return $this->amountDeath;
    }

    public function setAmountDeath(?int $amountDeath): self
    {
        $this->amountDeath = $amountDeath;

        return $this;
    }

    public function getCountry(): ?Country
    {
        return $this->country;
    }

    public function setCountry(?Country $country): self
    {
        $this->country = $country;

        return $this;
    }

    public function getCoronaStatsFromDayBefore(): ?CoronaStats
    {
        if ($this->coronaStatYesterday instanceof CoronaStats)
        {
            return $this->coronaStatYesterday;
        }
        $currentDate = $this->getDate();
        if (!($currentDate instanceof \DateTime) || !$this->getCountry())
        {
            return null;
        }
        $theDayBefore = (clone $currentDate)->modify('-1 day')->format('Y-m-d');

        $filteredStatResult = $this->getCountry()->getCoronaStats()->filter(
            static function (CoronaStats $entity) use ($theDayBefore)
            {
                $tmpDate = $entity->getDate();

                return $tmpDate instanceof \DateTime && $tmpDate->format('Y-m-d') === $theDayBefore;
            }
        )->first();

        if ($filteredStatResult instanceof CoronaStats)
        {
            $this->coronaStatYesterday = $filteredStatResult;
        }

        return $this->coronaStatYesterday;
    }

    public function getAmountTheDayBefore() : int
    {
        $result = 0;
        $stat = $this->getCoronaStatsFromDayBefore();

        if ($stat instanceof CoronaStats)
        {
            $result = $stat->getAmount();
        }

        return $result;
    }

    public function getAmountHealedTheDayBefore() : int
    {
        $result = 0;
        $stat = $this->getCoronaStatsFromDayBefore();

        if ($stat instanceof CoronaStats)
        {
            $result = $stat->getAmountHealed();
        }

        return $result;
    }

    public function getAmountDeathTheDayBefore() : int
    {
        $result = 0;
        $stat = $this->getCoronaStatsFromDayBefore();

        if ($stat instanceof CoronaStats)
        {
            $result = $stat->getAmountDeath();
        }

        return $result;
    }

    public function getDoublingInfectionRateInDays()
    {
        $doublingRateInDays = 0;
        $amountOfTheDayBefore = $this->getAmountTheDayBefore();

        if ($amountOfTheDayBefore > 0 && $this->amount > 0)
        {
            $log = log($this->amount/$amountOfTheDayBefore);
            if ($log !== (float)0)
            {
                $doublingRateInDays = log(2) / $log;
            }
        }

        return $doublingRateInDays;
    }

    public function getDoublingHealedRateInDays()
    {
        $doublingRateInDays = 0;
        $amountOfTheDayBefore = $this->getAmountHealedTheDayBefore();

        if ($amountOfTheDayBefore > 0 && $this->amountHealed > 0)
        {
            $log = log($this->amountHealed/$amountOfTheDayBefore);
            if ($log !== (float)0)
            {
                $doublingRateInDays = log(2) / $log;
            }
        }

        return $doublingRateInDays;
    }

    public function getDoublingDeathRateInDays()
    {
        $doublingRateInDays = 0;
        $amountOfTheDayBefore = $this->getAmountDeathTheDayBefore();

        if ($amountOfTheDayBefore > 0 && $this->amountDeath > 0)
        {
            $log = log($this->amountDeath/$amountOfTheDayBefore);
            if ($log !== (float)0)
            {
                $doublingRateInDays = log(2) / $log;
            }
        }

        return $doublingRateInDays;
    }
}
